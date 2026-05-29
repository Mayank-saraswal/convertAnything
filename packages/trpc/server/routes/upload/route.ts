import { z } from "../../schema";
import { sessionProcedure, router } from "../../trpc";
import {
  presignedUrlInputSchema,
  confirmUploadInputSchema,
} from "@repo/validators";
import { db } from "@repo/database";
import { jobsTable, tempFilesTable } from "@repo/database/schema";
import { getUploadPresignedUrl } from "@repo/storage";
import { addPdfJob } from "@repo/queue";
import type { JobType } from "@repo/validators";
import { rateLimitMiddleware } from "../../middleware/auth";

export const uploadRouter = router({
  /** Get a presigned URL for direct browser → R2 upload */
  getPresignedUrl: sessionProcedure
    .use(rateLimitMiddleware("upload", 10, 100))
    .input(presignedUrlInputSchema)
    .mutation(async ({ input }) => {
      const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}/${input.filename}`;

      const uploadUrl = await getUploadPresignedUrl(
        key,
        input.contentType,
        input.fileSize,
        300 // 5 min to upload
      );

      return { uploadUrl, key };
    }),

  /** After upload completes, confirm and create a processing job */
  confirmUpload: sessionProcedure
    .use(rateLimitMiddleware("process", 20, 200))
    .input(confirmUploadInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Calculate total file size (will be updated by worker)
      const totalSize = 0;

      // Create job in database
      const [job] = await db
        .insert(jobsTable)
        .values({
          sessionId: ctx.sessionId,
          userId: ctx.userId || undefined,
          type: input.toolType as JobType,
          status: "pending",
          inputFiles: input.keys,
          options: input.options || {},
          fileSize: totalSize,
          ipAddress:
            ctx.req.headers["x-forwarded-for"]?.toString() ||
            ctx.req.socket.remoteAddress ||
            null,
        })
        .returning();

      // Track temp files for cleanup
      for (const key of input.keys) {
        await db.insert(tempFilesTable).values({
          jobId: job!.id,
          storageKey: key,
          filename: key.split("/").pop() || "unknown",
          mimeType: "application/octet-stream",
          sizeBytes: 0,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        });
      }

      // Push to BullMQ queue
      await addPdfJob({
        jobId: job!.id,
        type: input.toolType as JobType,
        inputKeys: input.keys,
        options: input.options || undefined,
      });

      return { jobId: job!.id };
    }),
});
