import { mergePdfs } from "@repo/pdf-core";

export async function processMerge(
  inputBuffers: Buffer[],
  options?: Record<string, unknown>
) {
  const fileOrder = options?.fileOrder as number[] | undefined;
  const result = await mergePdfs(inputBuffers, fileOrder);
  return {
    buffer: result.buffer,
    filename: result.filename,
    mimeType: result.mimeType,
  };
}
