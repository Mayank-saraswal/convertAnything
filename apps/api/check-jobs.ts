import { db, desc } from '@repo/database';
import { jobsTable } from '@repo/database/schema';

async function main() {
  const jobs = await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt)).limit(5);
  console.log(jobs);
  process.exit(0);
}

main().catch(console.error);
