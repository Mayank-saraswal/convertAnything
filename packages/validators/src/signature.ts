import { z } from "zod";

export const signatureTypeEnum = z.enum(["draw", "type", "upload"]);
export const signatureRequestStatusEnum = z.enum(["pending", "signed", "declined", "expired"]);

export const signaturePlacementSchema = z.object({
  pageIndex: z.number().int().min(0),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  rotation: z.number().min(0).max(360).default(0),
});

export const saveSignatureInputSchema = z.object({
  name: z.string().min(1).max(255),
  signatureType: signatureTypeEnum,
  signatureData: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export const requestSignInputSchema = z.object({
  documentBlobKey: z.string().min(1),
  signerEmail: z.string().email(),
  placements: z.array(signaturePlacementSchema).default([]),
  expiresAt: z.string().datetime().optional(),
});

export const getDocumentInputSchema = z.object({
  requestId: z.string().uuid(),
  token: z.string().optional(),
});

export const submitSignInputSchema = z.object({
  requestId: z.string().uuid(),
  signatureId: z.string().uuid(),
  placements: z.array(signaturePlacementSchema).min(1),
  token: z.string().optional(),
});

export const signatureStatusInputSchema = z.object({
  requestId: z.string().uuid(),
});

export const downloadSignedInputSchema = z.object({
  requestId: z.string().uuid(),
});

export const auditActionSchema = z.enum([
  "document_viewed",
  "signature_drawn",
  "document_signed",
  "document_downloaded",
]);

export const auditLogEntrySchema = z.object({
  action: auditActionSchema,
  timestamp: z.string().datetime(),
  ipAddress: z.string(),
  userAgent: z.string(),
  country: z.string().nullable(),
});

export type SignatureType = z.infer<typeof signatureTypeEnum>;
export type SignatureRequestStatus = z.infer<typeof signatureRequestStatusEnum>;
export type SignaturePlacement = z.infer<typeof signaturePlacementSchema>;
export type SaveSignatureInput = z.infer<typeof saveSignatureInputSchema>;
export type RequestSignInput = z.infer<typeof requestSignInputSchema>;
export type GetDocumentInput = z.infer<typeof getDocumentInputSchema>;
export type SubmitSignInput = z.infer<typeof submitSignInputSchema>;
export type SignatureStatusInput = z.infer<typeof signatureStatusInputSchema>;
export type DownloadSignedInput = z.infer<typeof downloadSignedInputSchema>;
export type AuditAction = z.infer<typeof auditActionSchema>;
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
