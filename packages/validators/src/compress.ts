import { z } from "zod";

export const compressBatchStatusEnum = z.enum(["pending", "processing", "partial", "done", "failed"]);
export const compressImageStatusEnum = z.enum(["pending", "processing", "done", "failed"]);
export const outputFormatEnum = z.enum(["jpeg", "png", "webp", "avif"]);

export const compressOptionsSchema = z.object({
  outputFormat: outputFormatEnum,
  quality: z.number().int().min(1).max(100),
  maxWidth: z.number().int().min(1).max(10000).optional(),
  maxHeight: z.number().int().min(1).max(10000).optional(),
  stripMetadata: z.boolean().default(true),
  lossless: z.boolean().default(false),
});

export const getSasUrlsInputSchema = z.object({
  count: z.number().int().min(1).max(100),
  filenames: z.array(z.string().min(1)).max(100),
});

export const startBatchInputSchema = z.object({
  sessionId: z.string().uuid(),
  images: z.array(z.object({
    blobKey: z.string().min(1),
    filename: z.string().min(1),
    sizeBytes: z.number().int().min(1),
  })).min(1).max(100),
  options: compressOptionsSchema,
});

export const batchStatusInputSchema = z.object({
  batchId: z.string().uuid(),
});

export const imageDownloadInputSchema = z.object({
  imageId: z.string().uuid(),
});

export const zipDownloadInputSchema = z.object({
  batchId: z.string().uuid(),
});

export type CompressBatchStatus = z.infer<typeof compressBatchStatusEnum>;
export type CompressImageStatus = z.infer<typeof compressImageStatusEnum>;
export type OutputFormat = z.infer<typeof outputFormatEnum>;
export type CompressOptions = z.infer<typeof compressOptionsSchema>;
export type GetSasUrlsInput = z.infer<typeof getSasUrlsInputSchema>;
export type StartBatchInput = z.infer<typeof startBatchInputSchema>;
export type BatchStatusInput = z.infer<typeof batchStatusInputSchema>;
export type ImageDownloadInput = z.infer<typeof imageDownloadInputSchema>;
export type ZipDownloadInput = z.infer<typeof zipDownloadInputSchema>;
