import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

let localStoragePath = "./local-storage";

/**
 * Initialize local file storage (for development).
 */
export function initLocalStorage(basePath: string = "./local-storage") {
  localStoragePath = basePath;
}

async function ensureDir(dirPath: string) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

function getFilePath(key: string): string {
  return join(localStoragePath, key);
}

/**
 * Save a buffer to local filesystem.
 */
export async function saveLocally(
  key: string,
  buffer: Buffer
): Promise<void> {
  const filePath = getFilePath(key);
  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  await ensureDir(dir);
  await writeFile(filePath, buffer);
}

/**
 * Read a file from local filesystem.
 */
export async function readLocally(key: string): Promise<Buffer> {
  const filePath = getFilePath(key);
  return readFile(filePath);
}

/**
 * Delete a file from local filesystem.
 */
export async function deleteLocally(key: string): Promise<void> {
  const filePath = getFilePath(key);
  try {
    await unlink(filePath);
  } catch {
    // File might not exist, that's OK
  }
}

/**
 * Get a "presigned URL" for local dev — just returns a local file path.
 * In dev mode, uploads go through the API instead of direct-to-storage.
 */
export function getLocalUploadUrl(key: string): string {
  return `/api/local-upload/${key}`;
}

export function getLocalDownloadUrl(key: string): string {
  return `/api/local-download/${key}`;
}
