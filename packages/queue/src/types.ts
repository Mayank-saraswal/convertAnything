import type { JobType } from "@repo/validators";

/** Job payload pushed to the BullMQ queue */
export interface PdfJobPayload {
  /** Job ID in the database */
  jobId: string;
  /** Tool type */
  type: JobType;
  /** R2 keys of input files */
  inputKeys: string[];
  /** Tool-specific options */
  options?: Record<string, unknown>;
}

/** Job priorities — lower number = higher priority */
export const JOB_PRIORITIES: Record<JobType, number> = {
  merge: 5,
  split: 5,
  rotate: 5,
  watermark: 5,
  jpg_to_pdf: 4,
  compress: 3,
  pdf_to_jpg: 3,
  unlock: 3,
  pdf_to_word: 1,
  word_to_pdf: 1,
};

/** Queue names */
export const QUEUE_NAMES = {
  PDF_PROCESSING: "pdf-processing",
} as const;
