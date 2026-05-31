import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  index,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const signatureTypeEnum = pgEnum("signature_type", [
  "draw",
  "type",
  "upload",
]);

export const signaturesTable = pgTable(
  "signatures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    signatureType: signatureTypeEnum("signature_type").notNull(),
    signatureBlob: text("signature_blob").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    index("idx_signatures_clerk_user_id").on(table.clerkUserId),
    index("idx_signatures_expires_at").on(table.expiresAt),
  ]
);

export const signatureRequestStatusEnum = pgEnum("signature_request_status", [
  "pending",
  "signed",
  "declined",
  "expired",
]);

export interface SignaturePlacement {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface AuditLogEntry {
  action: "document_viewed" | "signature_drawn" | "document_signed" | "document_downloaded";
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  country: string | null;
}

export const signatureRequestsTable = pgTable(
  "signature_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id").notNull(),
    clerkUserId: text("clerk_user_id").notNull(),
    signerEmail: varchar("signer_email", { length: 255 }).notNull(),
    status: signatureRequestStatusEnum("status").default("pending").notNull(),
    placements: jsonb("placements").$type<SignaturePlacement[]>().notNull(),
    signedAt: timestamp("signed_at"),
    signatureId: uuid("signature_id"),
    auditLog: jsonb("audit_log").$type<AuditLogEntry[]>().default([]),
    documentHash: text("document_hash"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    oneTimeToken: text("one_time_token"),
    tokenUsed: text("token_used").default("false"),
  },
  (table) => [
    index("idx_signature_requests_clerk_user_id").on(table.clerkUserId),
    index("idx_signature_requests_signer_email").on(table.signerEmail),
    index("idx_signature_requests_status").on(table.status),
    index("idx_signature_requests_expires_at").on(table.expiresAt),
    index("idx_signature_requests_one_time_token").on(table.oneTimeToken),
  ]
);

export type SelectSignature = typeof signaturesTable.$inferSelect;
export type InsertSignature = typeof signaturesTable.$inferInsert;
export type SelectSignatureRequest = typeof signatureRequestsTable.$inferSelect;
export type InsertSignatureRequest = typeof signatureRequestsTable.$inferInsert;
