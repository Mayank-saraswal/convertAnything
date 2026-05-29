import { compressPdf } from "@repo/pdf-core";

export async function processCompress(
  inputBuffers: Buffer[],
  options?: Record<string, unknown>
) {
  const quality =
    (options?.quality as "low" | "medium" | "high") || "medium";

  const result = await compressPdf(inputBuffers[0]!, quality);
  return {
    buffer: result.buffer,
    filename: result.filename,
    mimeType: result.mimeType,
  };
}
