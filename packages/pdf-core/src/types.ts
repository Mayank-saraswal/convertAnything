/** Result of a PDF processing operation */
export interface ProcessingResult {
  /** Output file buffer */
  buffer: Buffer;
  /** Suggested filename for the output */
  filename: string;
  /** MIME type of the output */
  mimeType: string;
  /** Number of pages in the output (if applicable) */
  pageCount?: number;
}

/** Result when producing multiple output files (e.g., split, PDF→images) */
export interface MultiFileResult {
  files: Array<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }>;
}
