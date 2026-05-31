import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const pdfSessionStatusEnum = pgEnum("pdf_session_status", [
  "editing",
  "flattening",
  "done",
  "expired",
]);

export interface FabricStatePerPage {
  pageIndex: number;
  fabricJson: string;
}

export const pdfSessionsTable = pgTable(
  "pdf_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull(),
    clerkUserId: text("clerk_user_id"),
    originalBlobKey: text("original_blob_key").notNull(),
    fabricStateJson: jsonb("fabric_state_json").$type<FabricStatePerPage[]>().default([]),
    pageOrder: jsonb("page_order").$type<number[]>().default([]),
    status: pdfSessionStatusEnum("status").default("editing").notNull(),
    flattenedBlobKey: text("flattened_blob_key"),
    jobId: uuid("job_id"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_pdf_sessions_session_id").on(table.sessionId),
    index("idx_pdf_sessions_clerk_user_id").on(table.clerkUserId),
    index("idx_pdf_sessions_status").on(table.status),
    index("idx_pdf_sessions_expires_at").on(table.expiresAt),
  ]
);

export type SelectPdfSession = typeof pdfSessionsTable.$inferSelect;
export type InsertPdfSession = typeof pdfSessionsTable.$inferInsert;
