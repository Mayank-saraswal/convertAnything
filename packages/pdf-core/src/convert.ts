import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, readdir, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { ProcessingResult } from "./types";

const execFileAsync = promisify(execFile);

/**
 * Convert PDF to Word (DOCX) using LibreOffice headless.
 */
export async function pdfToWord(
  pdfBuffer: Buffer
): Promise<ProcessingResult> {
  const tempDir = await mkdtemp(join(tmpdir(), "ca-pdf2word-"));
  const inputPath = join(tempDir, "input.pdf");

  try {
    await writeFile(inputPath, pdfBuffer);

    await execFileAsync("soffice", [
      "--headless",
      "--convert-to",
      "docx",
      "--outdir",
      tempDir,
      inputPath,
    ]);

    // Find the generated docx file
    const files = await readdir(tempDir);
    const docxFile = files.find((f) => f.endsWith(".docx"));
    if (!docxFile) {
      throw new Error("LibreOffice failed to generate DOCX output");
    }

    const outputBuffer = await readFile(join(tempDir, docxFile));

    return {
      buffer: outputBuffer,
      filename: "converted.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * Convert Word (DOCX) to PDF using LibreOffice headless.
 */
export async function wordToPdf(
  docxBuffer: Buffer
): Promise<ProcessingResult> {
  const tempDir = await mkdtemp(join(tmpdir(), "ca-word2pdf-"));
  const inputPath = join(tempDir, "input.docx");

  try {
    await writeFile(inputPath, docxBuffer);

    await execFileAsync("soffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      tempDir,
      inputPath,
    ]);

    const files = await readdir(tempDir);
    const pdfFile = files.find((f) => f.endsWith(".pdf"));
    if (!pdfFile) {
      throw new Error("LibreOffice failed to generate PDF output");
    }

    const outputBuffer = await readFile(join(tempDir, pdfFile));

    return {
      buffer: outputBuffer,
      filename: "converted.pdf",
      mimeType: "application/pdf",
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
