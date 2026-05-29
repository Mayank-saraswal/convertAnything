import { Worker, Job } from "bullmq";
import { getRedisConnection, QUEUE_NAMES } from "@repo/queue";
import { downloadFromR2, uploadToR2 } from "@repo/storage";
import { db, eq } from "@repo/database";
import { jobsTable } from "@repo/database/schema";
import { logger } from "@repo/logger";
import type { PdfJobPayload } from "@repo/queue";

// Import processors
import { processMerge } from "./processors/merge.processor";
import { processSplit } from "./processors/split.processor";
import { processRotate } from "./processors/rotate.processor";
import { processWatermark } from "./processors/watermark.processor";
import { processCompress } from "./processors/compress.processor";
import { processPdfToImage } from "./processors/pdf-to-image.processor";
import { processImageToPdf } from "./processors/image-to-pdf.processor";
import { processPdfToWord } from "./processors/pdf-to-word.processor";
import { processWordToPdf } from "./processors/word-to-pdf.processor";
import { processUnlock } from "./processors/unlock.processor";

// Processor registry
const processors: Record<
  string,
  (
    inputBuffers: Buffer[],
    options?: Record<string, unknown>
  ) => Promise<{ buffer: Buffer; filename: string; mimeType: string }>
> = {
  merge: processMerge,
  split: processSplit,
  rotate: processRotate,
  watermark: processWatermark,
  compress: processCompress,
  pdf_to_jpg: processPdfToImage,
  jpg_to_pdf: processImageToPdf,
  pdf_to_word: processPdfToWord,
  word_to_pdf: processWordToPdf,
  unlock: processUnlock,
};

/**
 * Start the BullMQ worker.
 */
export function startWorker(concurrency: number = 5): Worker<PdfJobPayload> {
  const connection = getRedisConnection();

  const worker = new Worker<PdfJobPayload>(
    QUEUE_NAMES.PDF_PROCESSING,
    async (job: Job<PdfJobPayload>) => {
      const { jobId, type, inputKeys, options } = job.data;
      logger.info(`[Worker] Processing job ${jobId} (${type})`);

      try {
        // Update status to processing
        await db
          .update(jobsTable)
          .set({ status: "processing" })
          .where(eq(jobsTable.id, jobId));

        // Download input files from R2
        const inputBuffers = await Promise.all(
          inputKeys.map((key) => downloadFromR2(key))
        );

        // Find and run the appropriate processor
        const processor = processors[type];
        if (!processor) {
          throw new Error(`Unknown job type: ${type}`);
        }

        const result = await processor(inputBuffers, options);

        // Upload output to R2
        const outputKey = `outputs/${jobId}/${result.filename}`;
        await uploadToR2(outputKey, result.buffer, result.mimeType);

        // Update job as completed
        await db
          .update(jobsTable)
          .set({
            status: "completed",
            outputFile: outputKey,
            outputSize: result.buffer.length,
            completedAt: new Date(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          })
          .where(eq(jobsTable.id, jobId));

        logger.info(`[Worker] Job ${jobId} completed successfully`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(`[Worker] Job ${jobId} failed: ${errorMessage}`);

        // Update job as failed
        await db
          .update(jobsTable)
          .set({
            status: "failed",
            errorMessage,
          })
          .where(eq(jobsTable.id, jobId));

        throw error; // Re-throw for BullMQ retry handling
      }
    },
    {
      connection,
      concurrency,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    }
  );

  worker.on("ready", () => {
    logger.info(`[Worker] Ready, concurrency: ${concurrency}`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`[Worker] Job ${job?.id} failed permanently: ${err.message}`);
  });

  worker.on("error", (err) => {
    logger.error(`[Worker] Error: ${err.message}`);
  });

  return worker;
}
