import { pdfToImages } from "@repo/pdf-core";
import { createZipFromFiles } from "../utils";

export async function processPdfToImage(
  inputBuffers: Buffer[],
  options?: Record<string, unknown>
) {
  const format = (options?.format as "jpg" | "png") || "jpg";
  const quality = (options?.quality as number) || 85;
  const dpi = (options?.dpi as number) || 150;

  const result = await pdfToImages(inputBuffers[0]!, format, quality, dpi);

  // If multiple images, zip them
  if (result.files.length > 1) {
    const zipBuffer = await createZipFromFiles(result.files);
    return {
      buffer: zipBuffer,
      filename: `pdf_images.zip`,
      mimeType: "application/zip",
    };
  }

  return {
    buffer: result.files[0]!.buffer,
    filename: result.files[0]!.filename,
    mimeType: result.files[0]!.mimeType,
  };
}
