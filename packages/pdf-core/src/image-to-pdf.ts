import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import type { ProcessingResult } from "./types";

/**
 * Convert images (JPG, PNG, WebP) to a single PDF.
 * @param imageBuffers - Array of image buffers
 * @param pageSize - Page size: "a4", "letter", or "fit" (match image dimensions)
 * @param margin - Margin in pixels
 */
export async function imagesToPdf(
  imageBuffers: Buffer[],
  pageSize: "a4" | "letter" | "fit" = "a4",
  margin: number = 0
): Promise<ProcessingResult> {
  if (imageBuffers.length === 0) {
    throw new Error("At least one image is required");
  }

  const pdf = await PDFDocument.create();

  // Page dimensions in points (72 points per inch)
  const pageSizes = {
    a4: { width: 595.28, height: 841.89 },
    letter: { width: 612, height: 792 },
  };

  for (const imgBuffer of imageBuffers) {
    // Convert to PNG for consistent embedding (pdf-lib supports PNG/JPEG natively)
    const metadata = await sharp(imgBuffer).metadata();
    const imgWidth = metadata.width || 800;
    const imgHeight = metadata.height || 600;

    // Determine page size
    let pageWidth: number;
    let pageHeight: number;

    if (pageSize === "fit") {
      pageWidth = imgWidth + margin * 2;
      pageHeight = imgHeight + margin * 2;
    } else {
      const dims = pageSizes[pageSize];
      pageWidth = dims.width;
      pageHeight = dims.height;
    }

    const page = pdf.addPage([pageWidth, pageHeight]);

    // Convert to PNG for pdf-lib embedding
    const pngBuffer = await sharp(imgBuffer).png().toBuffer();
    const embeddedImage = await pdf.embedPng(pngBuffer);

    // Calculate scaled dimensions to fit within page (preserving aspect ratio)
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const scale = Math.min(
      availableWidth / embeddedImage.width,
      availableHeight / embeddedImage.height,
      1 // Don't upscale
    );

    const scaledWidth = embeddedImage.width * scale;
    const scaledHeight = embeddedImage.height * scale;

    // Center the image on the page
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  const outputBytes = await pdf.save();

  return {
    buffer: Buffer.from(outputBytes),
    filename: "images.pdf",
    mimeType: "application/pdf",
    pageCount: imageBuffers.length,
  };
}
