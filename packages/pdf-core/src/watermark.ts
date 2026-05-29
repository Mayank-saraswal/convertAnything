import {
  PDFDocument,
  rgb,
  StandardFonts,
  degrees as pdfDegrees,
} from "pdf-lib";
import type { ProcessingResult } from "./types";

interface WatermarkOptions {
  text: string;
  fontSize?: number;
  opacity?: number;
  position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  rotation?: number;
  color?: string;
}

/**
 * Parse a hex color string to RGB values (0-1 range).
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return { r, g, b };
}

/**
 * Add a text watermark to all pages of a PDF.
 */
export async function addWatermark(
  pdfBuffer: Buffer,
  options: WatermarkOptions
): Promise<ProcessingResult> {
  const {
    text,
    fontSize = 48,
    opacity = 0.3,
    position = "center",
    rotation = -45,
    color = "#000000",
  } = options;

  const pdf = await PDFDocument.load(pdfBuffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const { r, g, b } = hexToRgb(color);
  const totalPages = pdf.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const page = pdf.getPage(i);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = fontSize;

    let x: number;
    let y: number;

    switch (position) {
      case "top-left":
        x = 20;
        y = height - textHeight - 20;
        break;
      case "top-right":
        x = width - textWidth - 20;
        y = height - textHeight - 20;
        break;
      case "bottom-left":
        x = 20;
        y = 20;
        break;
      case "bottom-right":
        x = width - textWidth - 20;
        y = 20;
        break;
      case "center":
      default:
        x = (width - textWidth) / 2;
        y = (height - textHeight) / 2;
        break;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(r, g, b),
      opacity,
      rotate: pdfDegrees(rotation),
    });
  }

  const outputBytes = await pdf.save();

  return {
    buffer: Buffer.from(outputBytes),
    filename: "watermarked.pdf",
    mimeType: "application/pdf",
    pageCount: totalPages,
  };
}
