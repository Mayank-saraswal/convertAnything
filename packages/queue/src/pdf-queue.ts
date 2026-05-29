import { Queue } from "bullmq";
import { getRedisConnection } from "./connection";
import { QUEUE_NAMES, JOB_PRIORITIES } from "./types";
import type { PdfJobPayload } from "./types";

let pdfQueue: Queue<PdfJobPayload> | null = null;

/**
 * Get or create the PDF processing queue.
 */
export function getPdfQueue(): Queue<PdfJobPayload> {
  if (pdfQueue) return pdfQueue;

  const connection = getRedisConnection();

  pdfQueue = new Queue<PdfJobPayload>(QUEUE_NAMES.PDF_PROCESSING, {
    connection: connection as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  });

  return pdfQueue!;
}

/**
 * Add a PDF processing job to the queue.
 */
export async function addPdfJob(payload: PdfJobPayload): Promise<string> {
  const queue = getPdfQueue();

  const priority = JOB_PRIORITIES[payload.type] ?? 3;

  const job = await queue.add(payload.type, payload, {
    priority,
    jobId: payload.jobId, // Use DB job ID as queue job ID
  });

  return job.id!;
}
