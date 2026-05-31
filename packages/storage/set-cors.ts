import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';

async function configureCORS() {
  const s3Client = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT!,
    region: process.env.DO_SPACES_REGION ?? 'us-east-1',
    credentials: {
      accessKeyId: process.env.DO_SPACES_KEY!,
      secretAccessKey: process.env.DO_SPACES_SECRET!,
    },
    forcePathStyle: false,
  });

  const bucket = process.env.DO_SPACES_BUCKET!;

  console.log(`Setting CORS for bucket: ${bucket}...`);

  try {
    const command = new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
            AllowedOrigins: ["*"], // Allow all origins for development
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    });

    await s3Client.send(command);
    console.log("CORS configuration applied successfully!");
  } catch (error) {
    console.error("Failed to set CORS:", error);
  }
}

configureCORS();
