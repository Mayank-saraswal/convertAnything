import {
  PDFDocument,
  rgb,
  StandardFonts,
  degrees as pdfDegrees,
} from "pdf-lib";
import type { ProcessingResult } from "./types";

interface WatermarkOptions {
  type?: "text" | "image";
  text?: string;
  imageBase64?: string; // base64 encoded string
  fontSize?: number;
  opacity?: number;
  position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  rotation?: number;
  color?: string;
  imageScale?: number;
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
    type = "text",
    text = "CONFIDENTIAL",
    imageBase64,
    fontSize = 48,
    opacity = 0.3,
    position = "center",
    rotation = -45,
    color = "#000000",
    imageScale = 0.5,
  } = options;

  const pdf = await PDFDocument.load(pdfBuffer);
  const totalPages = pdf.getPageCount();
  
  let font: any = null;
  let image: any = null;
  let { r, g, b } = { r: 0, g: 0, b: 0 };
  let elemWidth = 0;
  let elemHeight = 0;

  if (type === "text") {
    font = await pdf.embedFont(StandardFonts.Helvetica);
    const colorRgb = hexToRgb(color);
    r = colorRgb.r;
    g = colorRgb.g;
    b = colorRgb.b;
    elemWidth = font.widthOfTextAtSize(text, fontSize);
    elemHeight = fontSize;
  } else if (type === "image" && imageBase64) {
    // Detect image type and embed
    const imgBuffer = Buffer.from(imageBase64, "base64");
    // Magic numbers: PNG starts with 89 50 4E 47, JPG starts with FF D8
    if (imgBuffer[0] === 0xff && imgBuffer[1] === 0xd8) {
      image = await pdf.embedJpg(imgBuffer);
    } else {
      image = await pdf.embedPng(imgBuffer);
    }
    const dims = image.scale(imageScale);
    elemWidth = dims.width;
    elemHeight = dims.height;
  } else {
    // Fallback to text if image not provided but type was image
    font = await pdf.embedFont(StandardFonts.Helvetica);
    elemWidth = font.widthOfTextAtSize(text, fontSize);
    elemHeight = fontSize;
  }

  for (let i = 0; i < totalPages; i++) {
    const page = pdf.getPage(i);
    const { width, height } = page.getSize();

    let x: number;
    let y: number;

    switch (position) {
      case "top-left":
        x = 20;
        y = height - elemHeight - 20;
        break;
      case "top-right":
        x = width - elemWidth - 20;
        y = height - elemHeight - 20;
        break;
      case "bottom-left":
        x = 20;
        y = 20;
        break;
      case "bottom-right":
        x = width - elemWidth - 20;
        y = 20;
        break;
      case "center":
      default:
        x = (width - elemWidth) / 2;
        y = (height - elemHeight) / 2;
        break;
    }

    if (image) {
      page.drawImage(image, {
        x,
        y,
        width: elemWidth,
        height: elemHeight,
        opacity,
        rotate: pdfDegrees(rotation),
      });
    } else {
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
  }

  const outputBytes = await pdf.save();

  return {
    buffer: Buffer.from(outputBytes),
    filename: "watermarked.pdf",
    mimeType: "application/pdf",
    pageCount: totalPages,
  };
}
