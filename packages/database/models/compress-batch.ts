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

export const compressBatchStatusEnum = pgEnum("compress_batch_status", [
  "pending",
  "processing",
  "partial",
  "done",
  "failed",
]);

export const compressImageStatusEnum = pgEnum("compress_image_status", [
  "pending",
  "processing",
  "done",
  "failed",
]);

export interface CompressOptions {
  outputFormat: "jpeg" | "png" | "webp" | "avif";
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  stripMetadata: boolean;
  lossless: boolean;
}

export const compressBatchesTable = pgTable(
  "compress_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull(),
    clerkUserId: text("clerk_user_id"),
    totalImages: integer("total_images").notNull(),
    completedImages: integer("completed_images").default(0),
    failedImages: integer("failed_images").default(0),
    status: compressBatchStatusEnum("status").default("pending").notNull(),
    outputZipKey: text("output_zip_key"),
    options: jsonb("options").$type<CompressOptions>().notNull(),
    totalInputBytes: integer("total_input_bytes"),
    totalOutputBytes: integer("total_output_bytes"),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [
    index("idx_compress_batches_session_id").on(table.sessionId),
    index("idx_compress_batches_clerk_user_id").on(table.clerkUserId),
    index("idx_compress_batches_status").on(table.status),
    index("idx_compress_batches_expires_at").on(table.expiresAt),
  ]
);

export const compressImagesTable = pgTable(
  "compress_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id").notNull().references(() => compressBatchesTable.id, {
      onDelete: "cascade",
    }),
    originalBlobKey: text("original_blob_key").notNull(),
    outputBlobKey: text("output_blob_key"),
    originalFilename: text("original_filename").notNull(),
    originalSizeBytes: integer("original_size_bytes").notNull(),
    outputSizeBytes: integer("output_size_bytes"),
    outputFormat: text("output_format"),
    status: compressImageStatusEnum("status").default("pending").notNull(),
    errorMessage: text("error_message"),
    processingMs: integer("processing_ms"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_compress_images_batch_id").on(table.batchId),
    index("idx_compress_images_status").on(table.status),
  ]
);

export type SelectCompressBatch = typeof compressBatchesTable.$inferSelect;
export type InsertCompressBatch = typeof compressBatchesTable.$inferInsert;
export type SelectCompressImage = typeof compressImagesTable.$inferSelect;
export type InsertCompressImage = typeof compressImagesTable.$inferInsert;
