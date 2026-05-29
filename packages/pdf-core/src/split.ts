import { PDFDocument } from "pdf-lib";
import type { ProcessingResult, MultiFileResult } from "./types";

/**
 * Parse a page range string into an array of page indices (0-based).
 * Supports: "1-3,5,7-10" → [0,1,2,4,6,7,8,9]
 */
function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.split(",").map((s) => s.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr!, 10);
      const end = parseInt(endStr!, 10);
      if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages) {
        throw new Error(
          `Invalid page range: ${part}. Pages must be between 1 and ${totalPages}`
        );
      }
      for (let i = start; i <= end; i++) {
        pages.add(i - 1); // Convert to 0-based
      }
    } else {
      const page = parseInt(part, 10);
      if (isNaN(page) || page < 1 || page > totalPages) {
        throw new Error(
          `Invalid page number: ${part}. Pages must be between 1 and ${totalPages}`
        );
      }
      pages.add(page - 1);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Split a PDF by extracting specific pages.
 * @param pdfBuffer - Source PDF buffer
 * @param mode - "all" splits into individual pages, "range" extracts specific pages, "custom" same as range
 * @param pages - Page range string (e.g., "1-3,5,7-10")
 * @returns Array of PDF buffers (one per extracted segment or page)
 */
export async function splitPdf(
  pdfBuffer: Buffer,
  mode: "all" | "range" | "custom" = "all",
  pages?: string
): Promise<MultiFileResult> {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();

  if (totalPages === 0) {
    throw new Error("PDF has no pages to split");
  }

  if (mode === "all") {
    // Split into individual pages
    const files: MultiFileResult["files"] = [];

    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
      newPdf.addPage(copiedPage!);
      const bytes = await newPdf.save();
      files.push({
        buffer: Buffer.from(bytes),
        filename: `page_${i + 1}.pdf`,
        mimeType: "application/pdf",
      });
    }

    return { files };
  }

  // Range or custom mode
  if (!pages) {
    throw new Error("Page range is required for range/custom mode");
  }

  const pageIndices = parsePageRange(pages, totalPages);

  if (pageIndices.length === 0) {
    throw new Error("No valid pages found in the specified range");
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
  for (const page of copiedPages) {
    newPdf.addPage(page);
  }

  const bytes = await newPdf.save();

  return {
    files: [
      {
        buffer: Buffer.from(bytes),
        filename: `split_pages.pdf`,
        mimeType: "application/pdf",
      },
    ],
  };
}

/**
 * Extract specific pages from a PDF into a single output PDF.
 */
export async function extractPages(
  pdfBuffer: Buffer,
  pageIndices: number[]
): Promise<ProcessingResult> {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();

  for (const idx of pageIndices) {
    if (idx < 0 || idx >= totalPages) {
      throw new Error(
        `Page index ${idx} is out of range (0-${totalPages - 1})`
      );
    }
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
  for (const page of copiedPages) {
    newPdf.addPage(page);
  }

  const bytes = await newPdf.save();

  return {
    buffer: Buffer.from(bytes),
    filename: "extracted.pdf",
    mimeType: "application/pdf",
    pageCount: newPdf.getPageCount(),
  };
}
