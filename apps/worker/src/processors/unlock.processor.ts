import { unlockPdf } from "@repo/pdf-core";

export async function processUnlock(
  inputBuffers: Buffer[],
  options?: Record<string, unknown>
) {
  const password = options?.password as string | undefined;

  const result = await unlockPdf(inputBuffers[0]!, password);
  return {
    buffer: result.buffer,
    filename: result.filename,
    mimeType: result.mimeType,
  };
}
