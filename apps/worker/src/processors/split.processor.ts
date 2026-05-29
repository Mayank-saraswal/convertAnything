import { splitPdf } from "@repo/pdf-core";
import { createZipFromFiles } from "../utils";

export async function processSplit(
  inputBuffers: Buffer[],
  options?: Record<string, unknown>
) {
  const mode = (options?.mode as "all" | "range" | "custom") || "all";
  const pages = options?.pages as string | undefined;

  const result = await splitPdf(inputBuffers[0]!, mode, pages);

  // If multiple files, zip them
  if (result.files.length > 1) {
    const zipBuffer = await createZipFromFiles(result.files);
    return {
      buffer: zipBuffer,
      filename: "split_pages.zip",
      mimeType: "application/zip",
    };
  }

  // Single file output
  return {
    buffer: result.files[0]!.buffer,
    filename: result.files[0]!.filename,
    mimeType: result.files[0]!.mimeType,
  };
}
