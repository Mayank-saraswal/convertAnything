import { db, eq, lt } from "@repo/database";
import { tempFilesTable, jobsTable } from "@repo/database/schema";
import { deleteObject, deleteObjects } from "@repo/storage";

export function cleanupWorker() {
  setInterval(async () => {
    const now = new Date();
    const expired = await db.select()
      .from(tempFilesTable)
      .where(lt(tempFilesTable.expiresAt, now));

    if (expired.length > 0) {
      const keys = expired.map(f => f.azureBlobKey);
      await deleteObjects(keys);
      for (const file of expired) {
        await db.delete(tempFilesTable).where(eq(tempFilesTable.id, file.id));
      }
    }

    const expiredJobs = await db.select()
      .from(jobsTable)
      .where(lt(jobsTable.expiresAt!, now));

    for (const job of expiredJobs) {
      if (job.outputFile) {
        await deleteObject(job.outputFile);
      }
      await db.delete(jobsTable).where(eq(jobsTable.id, job.id));
    }

    if (expired.length > 0 || expiredJobs.length > 0) {
      console.log(`Cleaned up ${expired.length} files, ${expiredJobs.length} jobs`);
    }
  }, 15 * 60 * 1000); // Every 15 minutes
}
