import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { jobsTable } from "./job";

export const tempFilesTable = pgTable(
  "temp_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Link to job
    jobId: uuid("job_id").references(() => jobsTable.id, {
      onDelete: "cascade",
    }),

    // Storage
    storageKey: text("storage_key").notNull(), // R2 key or local path
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),

    // Auto-cleanup (1 hour by default)
    expiresAt: timestamp("expires_at").notNull(),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_temp_files_job_id").on(table.jobId),
    index("idx_temp_files_expires_at").on(table.expiresAt),
  ]
);

export type SelectTempFile = typeof tempFilesTable.$inferSelect;
export type InsertTempFile = typeof tempFilesTable.$inferInsert;
