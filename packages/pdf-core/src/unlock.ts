import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { ProcessingResult } from "./types";

const execFileAsync = promisify(execFile);

/**
 * Remove password protection from a PDF using qpdf.
 * @param pdfBuffer - Protected PDF buffer
 * @param password - Optional password (if the PDF requires one to open)
 */
export async function unlockPdf(
  pdfBuffer: Buffer,
  password?: string
): Promise<ProcessingResult> {
  const tempDir = await mkdtemp(join(tmpdir(), "ca-unlock-"));
  const inputPath = join(tempDir, "input.pdf");
  const outputPath = join(tempDir, "output.pdf");

  try {
    await writeFile(inputPath, pdfBuffer);

    const args = ["--decrypt"];
    if (password) {
      args.push(`--password=${password}`);
    }
    args.push(inputPath, outputPath);

    try {
      await execFileAsync("qpdf", args);
    } catch (error: any) {
      if (error.code === "ENOENT" && process.platform === "win32") {
        try {
          await execFileAsync("C:\\qpdf\\qpdf-12.3.2-msvc64\\bin\\qpdf.exe", args);
        } catch (fallbackError: any) {
          if (fallbackError.code === "ENOENT") {
            throw new Error("QPDF is not installed or not in system PATH.");
          }
          if (fallbackError.message?.includes("invalid password")) {
            throw new Error("Incorrect or missing password for this PDF.");
          }
          throw fallbackError;
        }
      } else if (error.code === "ENOENT") {
        throw new Error("QPDF is not installed or not in system PATH.");
      } else {
        if (error.message?.includes("invalid password")) {
          throw new Error("Incorrect or missing password for this PDF.");
        }
        throw error;
      }
    }

    const outputBuffer = await readFile(outputPath);

    return {
      buffer: outputBuffer,
      filename: "unlocked.pdf",
      mimeType: "application/pdf",
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
