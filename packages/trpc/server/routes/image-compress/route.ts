import { z } from "../../schema";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import {
  getSasUrlsInputSchema,
  startBatchInputSchema,
  batchStatusInputSchema,
  imageDownloadInputSchema,
  zipDownloadInputSchema,
} from "@repo/validators";
import { db, eq } from "@repo/database";
import { compressBatchesTable, compressImagesTable } from "@repo/database/schema";
import { generateUploadSasUrl, generateDownloadSasUrl } from "@repo/storage";
import { getPdfQueue } from "@repo/queue";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";

export const imageCompressRouter = router({
  getSasUrls: publicProcedure
    .input(getSasUrlsInputSchema)
    .mutation(async ({ input }) => {
      try {
        const results = await Promise.all(
          input.filenames.slice(0, input.count).map(async (filename) => {
            const blobKey = `compress/${randomUUID()}/${filename}`;
            const { uploadUrl } = await generateUploadSasUrl(
              blobKey,
              "application/octet-stream"
            );
            return { uploadUrl, blobKey, filename };
          })
        );

        return { urls: results };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate upload URLs",
        });
      }
    }),

  startBatch: publicProcedure
    .input(startBatchInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const [batch] = await db
          .insert(compressBatchesTable)
          .values({
            sessionId: input.sessionId,
            clerkUserId: ctx.userId,
            totalImages: input.images.length,
            options: input.options,
            totalInputBytes: input.images.reduce((sum, img) => sum + img.sizeBytes, 0),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          })
          .returning();

        const imageRecords = await db
          .insert(compressImagesTable)
          .values(
            input.images.map((img) => ({
              batchId: batch.id,
              originalBlobKey: img.blobKey,
              originalFilename: img.filename,
              originalSizeBytes: img.sizeBytes,
            }))
          )
          .returning();

        const queue = getPdfQueue();
        await Promise.all(
          imageRecords.map((image) =>
            queue.add("compress-image", {
              imageId: image.id,
              batchId: batch.id,
              options: input.options,
            })
          )
        );

        return { batchId: batch.id };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start batch",
        });
      }
    }),

  getBatchStatus: publicProcedure
    .input(batchStatusInputSchema)
    .query(async ({ input }) => {
      try {
        const batches = await db
          .select()
          .from(compressBatchesTable)
          .where(eq(compressBatchesTable.id, input.batchId))
          .limit(1);

        const batch = batches[0];
        if (!batch) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Batch not found" });
        }

        const images = await db
          .select({
            id: compressImagesTable.id,
            originalFilename: compressImagesTable.originalFilename,
            originalSizeBytes: compressImagesTable.originalSizeBytes,
            outputSizeBytes: compressImagesTable.outputSizeBytes,
            outputFormat: compressImagesTable.outputFormat,
            status: compressImagesTable.status,
            errorMessage: compressImagesTable.errorMessage,
          })
          .from(compressImagesTable)
          .where(eq(compressImagesTable.batchId, input.batchId));

        return {
          total: batch.totalImages,
          completed: batch.completedImages,
          failed: batch.failedImages,
          status: batch.status,
          totalInputBytes: batch.totalInputBytes,
          totalOutputBytes: batch.totalOutputBytes,
          imageResults: images,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get batch status",
        });
      }
    }),

  getDownloadUrl: publicProcedure
    .input(imageDownloadInputSchema)
    .mutation(async ({ input }) => {
      try {
        const images = await db
          .select()
          .from(compressImagesTable)
          .where(eq(compressImagesTable.id, input.imageId))
          .limit(1);

        const image = images[0];
        if (!image) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Image not found" });
        }

        if (image.status !== "done" || !image.outputBlobKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Image not ready for download",
          });
        }

        const downloadUrl = await generateDownloadSasUrl(image.outputBlobKey);

        return { downloadUrl, filename: image.originalFilename };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get download URL",
        });
      }
    }),

  getZipDownloadUrl: publicProcedure
    .input(zipDownloadInputSchema)
    .mutation(async ({ input }) => {
      try {
        const batches = await db
          .select()
          .from(compressBatchesTable)
          .where(eq(compressBatchesTable.id, input.batchId))
          .limit(1);

        const batch = batches[0];
        if (!batch) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Batch not found" });
        }

        if (batch.status !== "done" || !batch.outputZipKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Batch not ready for download",
          });
        }

        const downloadUrl = await generateDownloadSasUrl(batch.outputZipKey);

        return { downloadUrl };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get ZIP download URL",
        });
      }
    }),
});
