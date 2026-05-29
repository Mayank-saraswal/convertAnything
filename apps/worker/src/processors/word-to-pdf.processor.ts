import { wordToPdf } from "@repo/pdf-core";

export async function processWordToPdf(
  inputBuffers: Buffer[],
  _options?: Record<string, unknown>
) {
  const result = await wordToPdf(inputBuffers[0]!);
  return {
    buffer: result.buffer,
    filename: result.filename,
    mimeType: result.mimeType,
  };
}
