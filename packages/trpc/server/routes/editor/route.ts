import { z } from "../../schema";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import {
  initSessionInputSchema,
  saveStateInputSchema,
  loadSessionInputSchema,
  flattenInputSchema,
  editorJobStatusInputSchema,
  editorDownloadInputSchema,
} from "@repo/validators";
import { db, eq } from "@repo/database";
import { pdfSessionsTable } from "@repo/database/schema";
import { generateUploadSasUrl, generateDownloadSasUrl } from "@repo/storage";
import { addPdfJob } from "@repo/queue";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";

export const editorRouter = router({
  initSession: publicProcedure
    .input(initSessionInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const sessionId = randomUUID();
        const blobKey = `editor/${sessionId}/${input.filename}`;

        const { uploadUrl } = await generateUploadSasUrl(
          blobKey,
          input.mimeType
        );

        const [session] = await db
          .insert(pdfSessionsTable)
          .values({
            sessionId,
            clerkUserId: ctx.userId,
            originalBlobKey: blobKey,
            status: "editing",
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          })
          .returning();

        return {
          sessionId: session.sessionId,
          uploadUrl,
          blobKey,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initialize session",
        });
      }
    }),

  saveState: publicProcedure
    .input(saveStateInputSchema)
    .mutation(async ({ input }) => {
      try {
        const sessions = await db
          .select()
          .from(pdfSessionsTable)
          .where(eq(pdfSessionsTable.sessionId, input.sessionId))
          .limit(1);

        const session = sessions[0];
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }

        await db
          .update(pdfSessionsTable)
          .set({
            fabricStateJson: input.fabricStateJson,
            pageOrder: input.pageOrder,
          })
          .where(eq(pdfSessionsTable.sessionId, input.sessionId));

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save state",
        });
      }
    }),

  loadSession: publicProcedure
    .input(loadSessionInputSchema)
    .query(async ({ input }) => {
      try {
        const sessions = await db
          .select()
          .from(pdfSessionsTable)
          .where(eq(pdfSessionsTable.sessionId, input.sessionId))
          .limit(1);

        const session = sessions[0];
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }

        if (session.status === "expired" || new Date() > session.expiresAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Session has expired" });
        }

        const documentUrl = await generateDownloadSasUrl(session.originalBlobKey);

        return {
          documentUrl,
          fabricStateJson: session.fabricStateJson,
          pageOrder: session.pageOrder,
          status: session.status,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load session",
        });
      }
    }),

  flatten: publicProcedure
    .input(flattenInputSchema)
    .mutation(async ({ input }) => {
      try {
        const sessions = await db
          .select()
          .from(pdfSessionsTable)
          .where(eq(pdfSessionsTable.sessionId, input.sessionId))
          .limit(1);

        const session = sessions[0];
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }

        if (session.status !== "editing") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Session is not in editing state",
          });
        }

        const jobId = randomUUID();
        await addPdfJob({
          jobId,
          type: "flatten",
          inputKeys: [session.originalBlobKey],
          options: {
            sessionId: input.sessionId,
            fabricStateJson: session.fabricStateJson,
            pageOrder: session.pageOrder,
          },
        });

        await db
          .update(pdfSessionsTable)
          .set({
            status: "flattening",
            jobId,
          })
          .where(eq(pdfSessionsTable.sessionId, input.sessionId));

        return { jobId };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start flatten job",
        });
      }
    }),

  getJobStatus: publicProcedure
    .input(editorJobStatusInputSchema)
    .query(async ({ input }) => {
      try {
        const sessions = await db
          .select({
            status: pdfSessionsTable.status,
            flattenedBlobKey: pdfSessionsTable.flattenedBlobKey,
          })
          .from(pdfSessionsTable)
          .where(eq(pdfSessionsTable.jobId, input.jobId))
          .limit(1);

        const session = sessions[0];
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
        }

        return {
          status: session.status,
          isComplete: session.status === "done",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get job status",
        });
      }
    }),

  getDownloadUrl: publicProcedure
    .input(editorDownloadInputSchema)
    .mutation(async ({ input }) => {
      try {
        const sessions = await db
          .select()
          .from(pdfSessionsTable)
          .where(eq(pdfSessionsTable.sessionId, input.sessionId))
          .limit(1);

        const session = sessions[0];
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }

        if (session.status !== "done" || !session.flattenedBlobKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Document not ready for download",
          });
        }

        const downloadUrl = await generateDownloadSasUrl(session.flattenedBlobKey);

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
