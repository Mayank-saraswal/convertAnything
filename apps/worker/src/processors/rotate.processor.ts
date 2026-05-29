import { rotatePdf } from "@repo/pdf-core";

export async function processRotate(
  inputBuffers: Buffer[],
  options?: Record<string, unknown>
) {
  const degrees = parseInt((options?.degrees as string) || "90", 10);
  const pages = options?.pages as number[] | undefined;

  const result = await rotatePdf(inputBuffers[0]!, degrees, pages);
  return {
    buffer: result.buffer,
    filename: result.filename,
    mimeType: result.mimeType,
  };
}
