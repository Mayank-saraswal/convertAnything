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
  const outputPath = join(tempDir, "output.docx");
  const pythonScriptPath = join(__dirname, "python", "pdf2docx_converter.py");

  try {
    await writeFile(inputPath, pdfBuffer);

    try {
      await execFileAsync("python", [
        pythonScriptPath,
        inputPath,
        outputPath,
      ]);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw new Error("Python is not installed or not in system PATH.");
      }
      throw new Error("Failed to convert PDF to Word using Python pdf2docx.");
    }

    // Check if the generated docx file exists
    try {
      const outputBuffer = await readFile(outputPath);
      return {
        buffer: outputBuffer,
        filename: "converted.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
    } catch (e) {
      throw new Error("Python failed to generate DOCX output");
    }
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

    try {
      await execFileAsync("soffice", [
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        tempDir,
        inputPath,
      ]);
    } catch (error: any) {
      if (error.code === "ENOENT" && process.platform === "win32") {
        try {
          await execFileAsync("C:\\Program Files\\LibreOffice\\program\\soffice.exe", [
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            tempDir,
            inputPath,
          ]);
        } catch (fallbackError: any) {
          if (fallbackError.code === "ENOENT") {
            throw new Error("LibreOffice (soffice) is not installed or not in system PATH.");
          }
          throw fallbackError;
        }
      } else if (error.code === "ENOENT") {
        throw new Error("LibreOffice (soffice) is not installed or not in system PATH.");
      } else {
        throw error;
      }
    }

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
