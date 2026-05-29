import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { ProcessingResult } from "./types";

const execFileAsync = promisify(execFile);

/**
 * Compress a PDF using Ghostscript.
 * @param pdfBuffer - Source PDF buffer
 * @param quality - Compression level: "low" (smallest), "medium", "high" (best quality)
 */
export async function compressPdf(
  pdfBuffer: Buffer,
  quality: "low" | "medium" | "high" = "medium"
): Promise<ProcessingResult> {
  // Map quality to Ghostscript dPDFSETTINGS
  const settingsMap = {
    low: "/screen", // 72 DPI — smallest
    medium: "/ebook", // 150 DPI — balanced
    high: "/printer", // 300 DPI — high quality
  };

  const tempDir = await mkdtemp(join(tmpdir(), "ca-compress-"));
  const inputPath = join(tempDir, "input.pdf");
  const outputPath = join(tempDir, "output.pdf");

  try {
    await writeFile(inputPath, pdfBuffer);

    await execFileAsync("gs", [
      "-sDEVICE=pdfwrite",
      `-dPDFSETTINGS=${settingsMap[quality]}`,
      "-dNOPAUSE",
      "-dBATCH",
      "-dQUIET",
      "-dCompatibilityLevel=1.4",
      `-sOutputFile=${outputPath}`,
      inputPath,
    ]);

    const outputBuffer = await readFile(outputPath);

    return {
      buffer: outputBuffer,
      filename: "compressed.pdf",
      mimeType: "application/pdf",
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
