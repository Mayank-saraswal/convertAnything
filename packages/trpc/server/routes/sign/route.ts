import { z } from "../../schema";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import {
  saveSignatureInputSchema,
  requestSignInputSchema,
  getDocumentInputSchema,
  submitSignInputSchema,
  signatureStatusInputSchema,
  downloadSignedInputSchema,
} from "@repo/validators";
import { db, eq, and, gt } from "@repo/database";
import {
  signaturesTable,
  signatureRequestsTable,
} from "@repo/database/schema";
import {
  generateUploadPresignedUrl,
  generateDownloadPresignedUrl,
  uploadBlob,
  downloadBuffer,
} from "@repo/storage";
import { addPdfJob, getPdfQueue } from "@repo/queue";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { createHash } from "crypto";

function generateOneTimeToken(): string {
  return randomUUID() + "-" + Date.now().toString(36);
}

function getClientIp(req: any): string {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["cf-connecting-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function getUserAgent(req: any): string {
  return req.headers["user-agent"] || "unknown";
}

function getCountry(req: any): string | null {
  return req.headers["cf-ipcountry"] || null;
}

function hashBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export const signRouter = router({
  saveSignature: protectedProcedure
    .input(saveSignatureInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const signatureBuffer = Buffer.from(
          input.signatureData.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );

        const blobKey = `signatures/${ctx.userId}/${randomUUID()}.png`;
        await uploadBlob(blobKey, signatureBuffer, "image/png");

        const [signature] = await db
          .insert(signaturesTable)
          .values({
            clerkUserId: ctx.userId,
            name: input.name,
            signatureType: input.signatureType,
            signatureBlob: blobKey,
            ipAddress: input.ipAddress || getClientIp(ctx.req),
            userAgent: input.userAgent || getUserAgent(ctx.req),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          })
          .returning();

        return { signatureId: signature.id };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save signature",
        });
      }
    }),

  requestSign: protectedProcedure
    .input(requestSignInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const oneTimeToken = generateOneTimeToken();
        const expiresAt = input.expiresAt
          ? new Date(input.expiresAt)
          : new Date(Date.now() + 72 * 60 * 60 * 1000);

        const pdfBuffer = await downloadBuffer(input.documentBlobKey);
        const documentHash = hashBuffer(pdfBuffer);

        const [request] = await db
          .insert(signatureRequestsTable)
          .values({
            documentId: randomUUID(),
            clerkUserId: ctx.userId,
            signerEmail: input.signerEmail,
            placements: input.placements,
            expiresAt,
            documentHash,
            oneTimeToken,
            auditLog: [
              {
                action: "document_viewed",
                timestamp: new Date().toISOString(),
                ipAddress: getClientIp(ctx.req),
                userAgent: getUserAgent(ctx.req),
                country: getCountry(ctx.req),
              },
            ],
          })
          .returning();

        return {
          requestId: request.id,
          oneTimeToken,
          expiresAt: request.expiresAt,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create signature request",
        });
      }
    }),

  getDocument: publicProcedure
    .input(getDocumentInputSchema)
    .query(async ({ input, ctx }) => {
      try {
        const conditions = [eq(signatureRequestsTable.id, input.requestId)];

        if (input.token) {
          conditions.push(eq(signatureRequestsTable.oneTimeToken, input.token));
        }

        const requests = await db
          .select()
          .from(signatureRequestsTable)
          .where(and(...conditions))
          .limit(1);

        const request = requests[0];
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        if (request.status === "expired" || new Date() > request.expiresAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Request has expired" });
        }

        if (request.tokenUsed && input.token) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Token already used" });
        }

        const documentUrl = await generateDownloadPresignedUrl(
          `documents/${request.documentId}.pdf`
        );

        await db
          .update(signatureRequestsTable)
          .set({
            auditLog: [
              ...(request.auditLog || []),
              {
                action: "document_viewed",
                timestamp: new Date().toISOString(),
                ipAddress: getClientIp(ctx.req),
                userAgent: getUserAgent(ctx.req),
                country: getCountry(ctx.req),
              },
            ],
          })
          .where(eq(signatureRequestsTable.id, input.requestId));

        return {
          documentUrl,
          placements: request.placements,
          status: request.status,
          signerEmail: request.signerEmail,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get document",
        });
      }
    }),

  submitSign: publicProcedure
    .input(submitSignInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const requests = await db
          .select()
          .from(signatureRequestsTable)
          .where(eq(signatureRequestsTable.id, input.requestId))
          .limit(1);

        const request = requests[0];
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        if (request.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Request already processed",
          });
        }

        if (new Date() > request.expiresAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Request has expired" });
        }

        if (input.token && request.oneTimeToken !== input.token) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        }

        const signatures = await db
          .select()
          .from(signaturesTable)
          .where(eq(signaturesTable.id, input.signatureId))
          .limit(1);

        const signature = signatures[0];
        if (!signature) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Signature not found" });
        }

        await db
          .update(signatureRequestsTable)
          .set({
            status: "signed",
            signedAt: new Date(),
            signatureId: input.signatureId,
            placements: input.placements,
            tokenUsed: true,
            auditLog: [
              ...(request.auditLog || []),
              {
                action: "document_signed",
                timestamp: new Date().toISOString(),
                ipAddress: getClientIp(ctx.req),
                userAgent: getUserAgent(ctx.req),
                country: getCountry(ctx.req),
              },
            ],
          })
          .where(eq(signatureRequestsTable.id, input.requestId));

        const jobId = randomUUID();
        await addPdfJob({
          jobId,
          type: "sign",
          inputKeys: [
            `documents/${request.documentId}.pdf`,
            signature.signatureBlob,
          ],
          options: {
            placements: input.placements,
            requestId: input.requestId,
            userName: signature.name,
          },
        });

        return { jobId, status: "processing" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit signature",
        });
      }
    }),

  getStatus: publicProcedure
    .input(signatureStatusInputSchema)
    .query(async ({ input }) => {
      try {
        const requests = await db
          .select({
            id: signatureRequestsTable.id,
            status: signatureRequestsTable.status,
            signedAt: signatureRequestsTable.signedAt,
            expiresAt: signatureRequestsTable.expiresAt,
          })
          .from(signatureRequestsTable)
          .where(eq(signatureRequestsTable.id, input.requestId))
          .limit(1);

        const request = requests[0];
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        return request;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get status",
        });
      }
    }),

  downloadSigned: publicProcedure
    .input(downloadSignedInputSchema)
    .mutation(async ({ input }) => {
      try {
        const requests = await db
          .select()
          .from(signatureRequestsTable)
          .where(eq(signatureRequestsTable.id, input.requestId))
          .limit(1);

        const request = requests[0];
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        if (request.status !== "signed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Document not signed yet",
          });
        }

        const downloadUrl = await generateDownloadPresignedUrl(
          `signed/${input.requestId}.pdf`
        );

        return { downloadUrl };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get download URL",
        });
      }
    }),
});
