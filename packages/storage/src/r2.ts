import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

let r2Client: S3Client | null = null;
let r2Bucket: string = "";

/**
 * Initialize the R2 client. Call once at app startup.
 */
export function initR2(config: R2Config) {
  r2Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  r2Bucket = config.bucket;
}

function getClient(): S3Client {
  if (!r2Client) throw new Error("R2 client not initialized. Call initR2() first.");
  return r2Client;
}

/**
 * Generate a presigned URL for uploading a file directly to R2.
 */
export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  contentLength: number,
  expiresInSeconds: number = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: r2Bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });

  return getSignedUrl(getClient(), command, {
    expiresIn: expiresInSeconds,
  });
}

/**
 * Generate a presigned URL for downloading a file from R2.
 */
export async function getDownloadPresignedUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: r2Bucket,
    Key: key,
  });

  return getSignedUrl(getClient(), command, {
    expiresIn: expiresInSeconds,
  });
}

/**
 * Upload a buffer to R2 directly.
 */
export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: r2Bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await getClient().send(command);
}

/**
 * Download a file from R2 as a buffer.
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: r2Bucket,
    Key: key,
  });

  const response = await getClient().send(command);
  const stream = response.Body;

  if (!stream) throw new Error(`File not found: ${key}`);

  // Convert readable stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Delete a file from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: r2Bucket,
    Key: key,
  });

  await getClient().send(command);
}
