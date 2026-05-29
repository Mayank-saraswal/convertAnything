import { z } from "zod";

export const JOB_TYPES = [
  "merge",
  "split",
  "compress",
  "pdf_to_word",
  "pdf_to_jpg",
  "word_to_pdf",
  "jpg_to_pdf",
  "rotate",
  "watermark",
  "unlock",
] as const;

export const JOB_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "expired",
] as const;

export const jobTypeSchema = z.enum(JOB_TYPES);
export const jobStatusSchema = z.enum(JOB_STATUSES);

export const jobStatusInputSchema = z.object({
  jobId: z.string().uuid(),
});

export const jobDownloadInputSchema = z.object({
  jobId: z.string().uuid(),
});

export const jobHistoryInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type JobType = z.infer<typeof jobTypeSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
