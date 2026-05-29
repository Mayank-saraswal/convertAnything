import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "expired",
]);

export const jobTypeEnum = pgEnum("job_type", [
  "merge",
  "split",
  "compress",
  "pdf_to_word",
  "pdf_to_jpg",
  "word_to_pdf",
  "jpg_to_pdf",
  "rotate",
  "watermark",
  "unlock",
]);

export const jobsTable = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Session tracking (always present — anonymous or authenticated)
    sessionId: text("session_id").notNull(),

    // Optional: linked to authenticated user
    userId: uuid("user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),

    // Job details
    type: jobTypeEnum("type").notNull(),
    status: jobStatusEnum("status").default("pending").notNull(),

    // Files
    inputFiles: jsonb("input_files").$type<string[]>().notNull(),
    outputFile: text("output_file"),

    // Tool-specific options (merge order, split pages, watermark text, etc.)
    options: jsonb("options").$type<Record<string, unknown>>(),

    // Size tracking
    fileSize: integer("file_size"),
    outputSize: integer("output_size"),

    // Error handling
    errorMessage: text("error_message"),

    // Rate limiting / analytics
    ipAddress: text("ip_address"),

    // Auto-cleanup
    expiresAt: timestamp("expires_at"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("idx_jobs_session_id").on(table.sessionId),
    index("idx_jobs_user_id").on(table.userId),
    index("idx_jobs_status").on(table.status),
    index("idx_jobs_expires_at").on(table.expiresAt),
  ]
);

export type SelectJob = typeof jobsTable.$inferSelect;
export type InsertJob = typeof jobsTable.$inferInsert;
