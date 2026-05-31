require('dotenv').config({ path: '../../.env' });
const { db } = require('@repo/database');
const { jobsTable } = require('@repo/database/schema');
const { desc } = require('drizzle-orm');

async function main() {
  const jobs = await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt)).limit(5);
  console.log(jobs);
  process.exit(0);
}

main().catch(console.error);
