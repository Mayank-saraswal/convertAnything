import { z } from "zod";

// Allowed MIME types for upload
export const ALLOWED_PDF_TYPES = ["application/pdf"] as const;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const ALLOWED_DOC_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_FILE_SIZE_FREE = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_PREMIUM = 100 * 1024 * 1024; // 100MB
export const MAX_FILES_PER_JOB = 20;

export const presignedUrlInputSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  fileSize: z.number().positive().max(MAX_FILE_SIZE_PREMIUM),
});

export const confirmUploadInputSchema = z.object({
  keys: z.array(z.string().min(1)).min(1).max(MAX_FILES_PER_JOB),
  toolType: z.string().min(1),
  options: z.record(z.string(), z.unknown()).optional(),
});

export type PresignedUrlInput = z.infer<typeof presignedUrlInputSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadInputSchema>;
