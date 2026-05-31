import { z } from "zod";

export const pdfSessionStatusEnum = z.enum(["editing", "flattening", "done", "expired"]);

export const fabricStatePerPageSchema = z.object({
  pageIndex: z.number().int().min(0),
  fabricJson: z.string(),
});

export const initSessionInputSchema = z.object({
  filename: z.string().min(1),
  fileSize: z.number().int().min(1),
  mimeType: z.string().min(1),
});

export const saveStateInputSchema = z.object({
  sessionId: z.string().uuid(),
  fabricStateJson: z.array(fabricStatePerPageSchema),
  pageOrder: z.array(z.number().int().min(0)),
});

export const loadSessionInputSchema = z.object({
  sessionId: z.string().uuid(),
});

export const flattenInputSchema = z.object({
  sessionId: z.string().uuid(),
});

export const editorJobStatusInputSchema = z.object({
  jobId: z.string().uuid(),
});

export const editorDownloadInputSchema = z.object({
  sessionId: z.string().uuid(),
});

export const editorToolEnum = z.enum([
  "select",
  "text",
  "highlight",
  "rectangle",
  "ellipse",
  "line",
  "arrow",
  "freehand",
  "image",
  "redact",
  "signature",
]);

export type PdfSessionStatus = z.infer<typeof pdfSessionStatusEnum>;
export type FabricStatePerPage = z.infer<typeof fabricStatePerPageSchema>;
export type InitSessionInput = z.infer<typeof initSessionInputSchema>;
export type SaveStateInput = z.infer<typeof saveStateInputSchema>;
export type LoadSessionInput = z.infer<typeof loadSessionInputSchema>;
export type FlattenInput = z.infer<typeof flattenInputSchema>;
export type EditorJobStatusInput = z.infer<typeof editorJobStatusInputSchema>;
export type EditorDownloadInput = z.infer<typeof editorDownloadInputSchema>;
export type EditorTool = z.infer<typeof editorToolEnum>;
