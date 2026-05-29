import { PDFDocument } from "pdf-lib";
import type { ProcessingResult } from "./types";

/**
 * Merge multiple PDF buffers into a single PDF.
 * @param pdfBuffers - Array of PDF file buffers to merge
 * @param fileOrder - Optional custom order (array of indices)
 * @returns Merged PDF buffer
 */
export async function mergePdfs(
  pdfBuffers: Buffer[],
  fileOrder?: number[]
): Promise<ProcessingResult> {
  if (pdfBuffers.length === 0) {
    throw new Error("At least one PDF is required for merging");
  }

  const mergedPdf = await PDFDocument.create();

  // Apply custom order if provided
  const orderedBuffers = fileOrder
    ? fileOrder.map((i) => {
        if (i < 0 || i >= pdfBuffers.length) {
          throw new Error(`Invalid file order index: ${i}`);
        }
        return pdfBuffers[i]!;
      })
    : pdfBuffers;

  for (const buffer of orderedBuffers) {
    const pdf = await PDFDocument.load(buffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    for (const page of pages) {
      mergedPdf.addPage(page);
    }
  }

  const outputBytes = await mergedPdf.save();

  return {
    buffer: Buffer.from(outputBytes),
    filename: "merged.pdf",
    mimeType: "application/pdf",
    pageCount: mergedPdf.getPageCount(),
  };
}
