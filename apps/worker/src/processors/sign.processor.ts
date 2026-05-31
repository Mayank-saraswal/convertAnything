import { PDFDocument, rgb } from "pdf-lib";

export async function processSign(
  inputBuffers: Buffer[],
  options?: Record<string, unknown>
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  if (inputBuffers.length < 2) {
    throw new Error("Missing PDF or signature buffer");
  }

  const pdfBytes = inputBuffers[0];
  const signatureBytes = inputBuffers[1];
  
  const placements = options?.placements as Array<{
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }>;

  if (!placements || placements.length === 0) {
    throw new Error("No signature placements provided");
  }

  const userName = (options?.userName as string) || "Unknown User";

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const sigImage = await pdfDoc.embedPng(signatureBytes);

  const pages = pdfDoc.getPages();

  for (const placement of placements) {
    const page = pages[placement.pageIndex];
    if (!page) continue;

    const { width: pageWidth, height: pageHeight } = page.getSize();
    
    const sigW = (placement.width / 100) * pageWidth;
    const sigH = (placement.height / 100) * pageHeight;

    // Transform: pdfY = pageHeight - (placementY/100 * pageHeight) - sigHeight
    // Transform: pdfX = placementX/100 * pageWidth
    const pdfX = (placement.x / 100) * pageWidth;
    const pdfY = pageHeight - (placement.y / 100) * pageHeight - sigH;

    page.drawImage(sigImage, {
      x: pdfX,
      y: pdfY,
      width: sigW,
      height: sigH,
      opacity: 1,
    });

    // Add invisible text for searchability
    page.drawText(`Signed by: ${userName}`, {
      x: pdfX,
      y: pdfY,
      size: 0.1,
      color: rgb(1, 1, 1),
    });
  }

  const savedPdfBytes = await pdfDoc.save();
  
  return {
    buffer: Buffer.from(savedPdfBytes),
    filename: "signed-document.pdf",
    mimeType: "application/pdf",
  };
}
