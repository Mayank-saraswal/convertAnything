import { PDFDocument, degrees } from "pdf-lib";
import type { ProcessingResult } from "./types";

/**
 * Rotate pages in a PDF.
 * @param pdfBuffer - Source PDF buffer
 * @param rotationDegrees - Degrees to rotate (90, 180, 270)
 * @param pageIndices - Which pages to rotate (empty = all pages)
 */
export async function rotatePdf(
  pdfBuffer: Buffer,
  rotationDegrees: number = 90,
  pageIndices?: number[]
): Promise<ProcessingResult> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const totalPages = pdf.getPageCount();

  const pagesToRotate =
    pageIndices && pageIndices.length > 0
      ? pageIndices
      : Array.from({ length: totalPages }, (_, i) => i);

  for (const idx of pagesToRotate) {
    if (idx < 0 || idx >= totalPages) {
      throw new Error(
        `Page index ${idx} is out of range (0-${totalPages - 1})`
      );
    }
    const page = pdf.getPage(idx);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + rotationDegrees));
  }

  const outputBytes = await pdf.save();

  return {
    buffer: Buffer.from(outputBytes),
    filename: "rotated.pdf",
    mimeType: "application/pdf",
    pageCount: totalPages,
  };
}
