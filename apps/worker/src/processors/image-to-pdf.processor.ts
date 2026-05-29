import { imagesToPdf } from "@repo/pdf-core";

export async function processImageToPdf(
  inputBuffers: Buffer[],
  options?: Record<string, unknown>
) {
  const pageSize = (options?.pageSize as "a4" | "letter" | "fit") || "a4";
  const margin = (options?.margin as number) || 0;

  const result = await imagesToPdf(inputBuffers, pageSize, margin);
  return {
    buffer: result.buffer,
    filename: result.filename,
    mimeType: result.mimeType,
  };
}
