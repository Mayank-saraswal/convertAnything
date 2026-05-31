require('dotenv').config({ path: '.env' });
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function main() {
  const client = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: process.env.DO_SPACES_REGION,
    credentials: {
      accessKeyId: process.env.DO_SPACES_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET,
    },
    forcePathStyle: false
  });
  
  const res = await client.send(new ListObjectsV2Command({
    Bucket: process.env.DO_SPACES_BUCKET,
    Prefix: 'uploads/'
  }));
  console.log("Files in bucket:");
  if(res.Contents) {
    res.Contents.slice(0, 5).forEach(f => console.log(f.Key, f.Size));
  } else {
    console.log("No files found");
  }
}

main().catch(console.error);
