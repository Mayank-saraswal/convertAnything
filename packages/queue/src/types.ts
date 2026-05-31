import type { JobType } from "@repo/validators";

export interface PdfJobPayload {
  jobId: string;
  type: JobType | "sign" | "flatten" | "compress-image";
  inputKeys: string[];
  options?: Record<string, unknown>;
}

export const JOB_PRIORITIES: Record<string, number> = {
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
  sign: 2,
  flatten: 4,
  "compress-image": 3,
};

export const QUEUE_NAMES = {
  PDF_PROCESSING: "pdf-processing",
} as const;
