import { z } from "../../schema";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import {
  jobStatusInputSchema,
  jobDownloadInputSchema,
  jobHistoryInputSchema,
} from "@repo/validators";
import { db, eq, desc } from "@repo/database";
import { jobsTable } from "@repo/database/schema";
import { generateDownloadPresignedUrl } from "@repo/storage";
import { TRPCError } from "@trpc/server";

export const jobRouter = router({
  /** Poll job status — anonymous or authenticated */
  status: publicProcedure
    .input(jobStatusInputSchema)
    .query(async ({ input, ctx }) => {
      const jobs = await db
        .select({
          id: jobsTable.id,
          type: jobsTable.type,
          status: jobsTable.status,
          errorMessage: jobsTable.errorMessage,
          outputSize: jobsTable.outputSize,
          createdAt: jobsTable.createdAt,
          completedAt: jobsTable.completedAt,
        })
        .from(jobsTable)
        .where(eq(jobsTable.id, input.jobId))
        .limit(1);

      const job = jobs[0];
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      return job;
    }),

  /** Get download URL for a completed job */
  downloadUrl: publicProcedure
    .input(jobDownloadInputSchema)
    .mutation(async ({ input }) => {
      const jobs = await db
        .select()
        .from(jobsTable)
        .where(eq(jobsTable.id, input.jobId))
        .limit(1);

      const job = jobs[0];
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      if (job.status !== "completed" || !job.outputFile) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Job is not ready for download",
        });
      }

      const downloadUrl = await generateDownloadPresignedUrl(
        job.outputFile
      );

      return { downloadUrl, filename: job.outputFile.split("/").pop() };
    }),

  /** Get job history — authenticated users only */
  history: protectedProcedure
    .input(jobHistoryInputSchema)
    .query(async ({ input, ctx }) => {
      const jobs = await db
        .select({
          id: jobsTable.id,
          type: jobsTable.type,
          status: jobsTable.status,
          fileSize: jobsTable.fileSize,
          outputSize: jobsTable.outputSize,
          createdAt: jobsTable.createdAt,
          completedAt: jobsTable.completedAt,
        })
        .from(jobsTable)
        .where(eq(jobsTable.userId, ctx.userId))
        .orderBy(desc(jobsTable.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return jobs;
    }),
});
