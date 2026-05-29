const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46]; // %PDF
const JPEG_MAGIC_BYTES = [0xff, 0xd8, 0xff];
const PNG_MAGIC_BYTES = [0x89, 0x50, 0x4e, 0x47];
const DOCX_MAGIC_BYTES = [0x50, 0x4b, 0x03, 0x04]; // ZIP (docx is a ZIP)

/** Validate file type by checking magic bytes */
export function validateFileType(
  buffer: Buffer,
  expectedType: "pdf" | "image" | "docx"
): boolean {
  if (buffer.length < 4) return false;

  switch (expectedType) {
    case "pdf":
      return matchMagicBytes(buffer, PDF_MAGIC_BYTES);
    case "image":
      return (
        matchMagicBytes(buffer, JPEG_MAGIC_BYTES) ||
        matchMagicBytes(buffer, PNG_MAGIC_BYTES)
      );
    case "docx":
      return matchMagicBytes(buffer, DOCX_MAGIC_BYTES);
    default:
      return false;
  }
}

/** Validate file size against a maximum */
export function validateFileSize(
  sizeBytes: number,
  maxBytes: number
): boolean {
  return sizeBytes > 0 && sizeBytes <= maxBytes;
}

/** Get file type from magic bytes */
export function detectFileType(
  buffer: Buffer
): "pdf" | "jpeg" | "png" | "zip" | "unknown" {
  if (buffer.length < 4) return "unknown";
  if (matchMagicBytes(buffer, PDF_MAGIC_BYTES)) return "pdf";
  if (matchMagicBytes(buffer, JPEG_MAGIC_BYTES)) return "jpeg";
  if (matchMagicBytes(buffer, PNG_MAGIC_BYTES)) return "png";
  if (matchMagicBytes(buffer, DOCX_MAGIC_BYTES)) return "zip";
  return "unknown";
}

function matchMagicBytes(buffer: Buffer, magic: number[]): boolean {
  for (let i = 0; i < magic.length; i++) {
    if (buffer[i] !== magic[i]) return false;
  }
  return true;
}
