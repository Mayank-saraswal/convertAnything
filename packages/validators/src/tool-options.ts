import { z } from "zod";

// Merge: order of files
export const mergeOptionsSchema = z
  .object({
    fileOrder: z.array(z.number().int().min(0)).optional(),
  })
  .optional();

// Split: which pages to extract
export const splitOptionsSchema = z.object({
  mode: z.enum(["all", "range", "custom"]).default("all"),
  // For range mode: "1-3,5,7-10"
  pages: z.string().optional(),
});

// Compress: quality level
export const compressOptionsSchema = z.object({
  quality: z.enum(["low", "medium", "high"]).default("medium"),
});

// Rotate: degrees
export const rotateOptionsSchema = z.object({
  degrees: z.enum(["90", "180", "270"]).default("90"),
  // Which pages to rotate (empty = all pages)
  pages: z.array(z.number().int().min(0)).optional(),
});

// Watermark: text or image overlay
export const watermarkOptionsSchema = z.object({
  text: z.string().min(1).max(200),
  fontSize: z.number().int().min(8).max(200).default(48),
  opacity: z.number().min(0.01).max(1).default(0.3),
  position: z
    .enum(["center", "top-left", "top-right", "bottom-left", "bottom-right"])
    .default("center"),
  rotation: z.number().min(-180).max(180).default(-45),
  color: z.string().default("#000000"),
});

// PDF to Image options
export const pdfToImageOptionsSchema = z.object({
  format: z.enum(["jpg", "png"]).default("jpg"),
  quality: z.number().int().min(1).max(100).default(85),
  dpi: z.number().int().min(72).max(600).default(150),
});

// Image to PDF options
export const imageToPdfOptionsSchema = z
  .object({
    pageSize: z.enum(["a4", "letter", "fit"]).default("a4"),
    margin: z.number().int().min(0).max(100).default(0),
  })
  .optional();

// Map tool type to its options schema
export const toolOptionsSchemas = {
  merge: mergeOptionsSchema,
  split: splitOptionsSchema,
  compress: compressOptionsSchema,
  rotate: rotateOptionsSchema,
  watermark: watermarkOptionsSchema,
  pdf_to_jpg: pdfToImageOptionsSchema,
  pdf_to_word: z.object({}).optional(),
  word_to_pdf: z.object({}).optional(),
  jpg_to_pdf: imageToPdfOptionsSchema,
  unlock: z.object({ password: z.string().optional() }).optional(),
} as const;

export type MergeOptions = z.infer<typeof mergeOptionsSchema>;
export type SplitOptions = z.infer<typeof splitOptionsSchema>;
export type CompressOptions = z.infer<typeof compressOptionsSchema>;
export type RotateOptions = z.infer<typeof rotateOptionsSchema>;
export type WatermarkOptions = z.infer<typeof watermarkOptionsSchema>;
export type PdfToImageOptions = z.infer<typeof pdfToImageOptionsSchema>;
export type ImageToPdfOptions = z.infer<typeof imageToPdfOptionsSchema>;
