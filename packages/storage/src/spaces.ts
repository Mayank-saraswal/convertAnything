import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// DigitalOcean Spaces config
// Endpoint format: https://{region}.digitaloceanspaces.com
// Lazy-init to ensure env vars are loaded before client creation
let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT!,
      region: process.env.DO_SPACES_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
      },
      forcePathStyle: false,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return _s3Client;
}

function getBucket(): string {
  return process.env.DO_SPACES_BUCKET!;
}

// ─────────────────────────────────────────────
// UPLOAD: Generate presigned URL for direct browser → DO Spaces upload
// ─────────────────────────────────────────────
export async function generateUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300 // 5 minutes to upload
): Promise<{ uploadUrl: string; blobKey: string }> {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: expiresInSeconds,
  });

  return { uploadUrl, blobKey: key };
}

// ─────────────────────────────────────────────
// DOWNLOAD: Generate presigned download URL
// ─────────────────────────────────────────────
export async function generateDownloadPresignedUrl(
  key: string,
  expiresInSeconds = 3600, // 1 hour
  filename?: string // optional: force download with specific filename
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ...(filename && {
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    }),
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: expiresInSeconds });
}

// ─────────────────────────────────────────────
// DELETE: Remove a single object
// ─────────────────────────────────────────────
export async function deleteObject(key: string): Promise<void> {
  try {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
  } catch (err: any) {
    if (err.name !== 'NoSuchKey') throw err;
  }
}

// ─────────────────────────────────────────────
// DELETE MULTIPLE: Batch delete (cleanup jobs)
// ─────────────────────────────────────────────
export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  const chunks = [];
  for (let i = 0; i < keys.length; i += 1000) {
    chunks.push(keys.slice(i, i + 1000));
  }

  for (const chunk of chunks) {
    await getS3Client().send({
      ...new DeleteObjectCommand({ Bucket: getBucket(), Key: '' }),
      input: {
        Bucket: getBucket(),
        Delete: {
          Objects: chunk.map(Key => ({ Key })),
          Quiet: true,
        },
      },
    } as any);
  }
}

// ─────────────────────────────────────────────
// UPLOAD BUFFER: Upload file buffer directly from server
// ─────────────────────────────────────────────
export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string,
  metadata?: Record<string, string>
): Promise<void> {
  await getS3Client().send(new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ContentLength: buffer.length,
    Metadata: metadata,
  }));
}

// ─────────────────────────────────────────────
// DOWNLOAD BUFFER: Download file as buffer
// ─────────────────────────────────────────────
export async function downloadBuffer(key: string): Promise<Buffer> {
  const response = await getS3Client().send(new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  }));

  if (!response.Body) throw new Error(`Empty body for key: ${key}`);

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// ─────────────────────────────────────────────
// EXISTS: Check if object exists
// ─────────────────────────────────────────────
export async function objectExists(key: string): Promise<boolean> {
  try {
    await getS3Client().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// LIST: List objects by prefix
// ─────────────────────────────────────────────
export async function listObjects(
  prefix: string,
  maxKeys = 1000
): Promise<{ key: string; size: number; lastModified: Date }[]> {
  const results = [];
  let continuationToken: string | undefined;

  do {
    const response = await getS3Client().send(new ListObjectsV2Command({
      Bucket: getBucket(),
      Prefix: prefix,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
    }));

    for (const obj of response.Contents ?? []) {
      if (obj.Key && obj.Size !== undefined && obj.LastModified) {
        results.push({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
        });
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return results;
}

// ─────────────────────────────────────────────
// COPY: Copy object within same bucket
// ─────────────────────────────────────────────
export async function copyObject(sourceKey: string, destKey: string): Promise<void> {
  await getS3Client().send(new CopyObjectCommand({
    Bucket: getBucket(),
    CopySource: `${getBucket()}/${sourceKey}`,
    Key: destKey,
  }));
}

// ─────────────────────────────────────────────
// CDN URL: Get public CDN URL for a key
// ─────────────────────────────────────────────
export function getCdnUrl(key: string): string {
  const cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT;
  if (!cdnEndpoint) {
    const bucket = process.env.DO_SPACES_BUCKET;
    const region = process.env.DO_SPACES_REGION ?? 'sgp1';
    return `https://${bucket}.${region}.digitaloceanspaces.com/${key}`;
  }
  return `${cdnEndpoint}/${key}`;
}

export { getS3Client, getBucket };
