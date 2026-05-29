import { execFile } from "child_process";
import { promisify } from "util";
import { readFile, readdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { MultiFileResult } from "./types";

const execFileAsync = promisify(execFile);

/**
 * Convert PDF pages to images using Poppler's pdftoppm.
 * @param pdfBuffer - Source PDF buffer
 * @param format - Output format: "jpg" or "png"
 * @param quality - JPEG quality (1-100)
 * @param dpi - Output DPI resolution
 */
export async function pdfToImages(
  pdfBuffer: Buffer,
  format: "jpg" | "png" = "jpg",
  quality: number = 85,
  dpi: number = 150
): Promise<MultiFileResult> {
  const tempDir = await mkdtemp(join(tmpdir(), "ca-pdf2img-"));
  const inputPath = join(tempDir, "input.pdf");
  const outputPrefix = join(tempDir, "page");

  try {
    await writeFile(inputPath, pdfBuffer);

    const args = [
      `-r`, String(dpi),
      format === "jpg" ? "-jpeg" : "-png",
    ];

    if (format === "jpg") {
      args.push("-jpegopt", `quality=${quality}`);
    }

    args.push(inputPath, outputPrefix);

    await execFileAsync("pdftoppm", args);

    // Read generated images
    const dirFiles = await readdir(tempDir);
    const imageFiles = dirFiles
      .filter((f) => f.startsWith("page") && (f.endsWith(".jpg") || f.endsWith(".png")))
      .sort();

    const files: MultiFileResult["files"] = [];
    for (const file of imageFiles) {
      const buffer = await readFile(join(tempDir, file));
      files.push({
        buffer,
        filename: file,
        mimeType: format === "jpg" ? "image/jpeg" : "image/png",
      });
    }

    return { files };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
