import { pdfToWord } from "@repo/pdf-core";

export async function processPdfToWord(
  inputBuffers: Buffer[],
  _options?: Record<string, unknown>
) {
  const result = await pdfToWord(inputBuffers[0]!);
  return {
    buffer: result.buffer,
    filename: result.filename,
    mimeType: result.mimeType,
  };
}
