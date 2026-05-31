require('dotenv').config({ path: '../../.env' });
const { downloadBuffer } = require('@repo/storage');
const { db } = require('@repo/database');
const { jobsTable } = require('@repo/database/schema');
const { desc } = require('drizzle-orm');

async function main() {
  const jobs = await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt)).limit(1);
  if (!jobs.length) return console.log("No jobs");
  const job = jobs[0];
  console.log("Testing download for job inputFiles:", job.inputFiles);
  for (const key of job.inputFiles) {
    try {
      console.log("Downloading", key);
      const buf = await downloadBuffer(key);
      console.log("Downloaded", key, buf.length, "bytes");
    } catch (e) {
      console.error("Error downloading", key, e.name, e.message);
    }
  }
  process.exit(0);
}
main();
