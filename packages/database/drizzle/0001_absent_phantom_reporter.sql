CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('merge', 'split', 'compress', 'pdf_to_word', 'pdf_to_jpg', 'word_to_pdf', 'jpg_to_pdf', 'rotate', 'watermark', 'unlock');--> statement-breakpoint
CREATE TYPE "public"."signature_request_status" AS ENUM('pending', 'signed', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."signature_type" AS ENUM('draw', 'type', 'upload');--> statement-breakpoint
CREATE TYPE "public"."pdf_session_status" AS ENUM('editing', 'flattening', 'done', 'expired');--> statement-breakpoint
CREATE TYPE "public"."compress_batch_status" AS ENUM('pending', 'processing', 'partial', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."compress_image_status" AS ENUM('pending', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"user_id" uuid,
	"type" "job_type" NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"input_files" jsonb NOT NULL,
	"output_file" text,
	"options" jsonb,
	"file_size" integer,
	"output_size" integer,
	"error_message" text,
	"ip_address" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "temp_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"azure_blob_key" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"endpoint" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"jobs_this_month" integer DEFAULT 0,
	"reset_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_plans_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "signature_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"clerk_user_id" text NOT NULL,
	"signer_email" varchar(255) NOT NULL,
	"status" "signature_request_status" DEFAULT 'pending' NOT NULL,
	"placements" jsonb NOT NULL,
	"signed_at" timestamp,
	"signature_id" uuid,
	"audit_log" jsonb DEFAULT '[]'::jsonb,
	"document_hash" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"one_time_token" text,
	"token_used" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"signature_type" "signature_type" NOT NULL,
	"signature_blob" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pdf_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"clerk_user_id" text,
	"original_blob_key" text NOT NULL,
	"fabric_state_json" jsonb DEFAULT '[]'::jsonb,
	"page_order" jsonb DEFAULT '[]'::jsonb,
	"status" "pdf_session_status" DEFAULT 'editing' NOT NULL,
	"flattened_blob_key" text,
	"job_id" uuid,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "compress_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"clerk_user_id" text,
	"total_images" integer NOT NULL,
	"completed_images" integer DEFAULT 0,
	"failed_images" integer DEFAULT 0,
	"status" "compress_batch_status" DEFAULT 'pending' NOT NULL,
	"output_zip_key" text,
	"options" jsonb NOT NULL,
	"total_input_bytes" integer,
	"total_output_bytes" integer,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compress_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"original_blob_key" text NOT NULL,
	"output_blob_key" text,
	"original_filename" text NOT NULL,
	"original_size_bytes" integer NOT NULL,
	"output_size_bytes" integer,
	"output_format" text,
	"status" "compress_image_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"processing_ms" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temp_files" ADD CONSTRAINT "temp_files_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compress_images" ADD CONSTRAINT "compress_images_batch_id_compress_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."compress_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_jobs_session_id" ON "jobs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_user_id" ON "jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_status" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_jobs_expires_at" ON "jobs" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_temp_files_job_id" ON "temp_files" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_temp_files_expires_at" ON "temp_files" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_rate_limits_identifier_endpoint" ON "rate_limits" USING btree ("identifier","endpoint");--> statement-breakpoint
CREATE INDEX "idx_signature_requests_clerk_user_id" ON "signature_requests" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "idx_signature_requests_signer_email" ON "signature_requests" USING btree ("signer_email");--> statement-breakpoint
CREATE INDEX "idx_signature_requests_status" ON "signature_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_signature_requests_expires_at" ON "signature_requests" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_signature_requests_one_time_token" ON "signature_requests" USING btree ("one_time_token");--> statement-breakpoint
CREATE INDEX "idx_signatures_clerk_user_id" ON "signatures" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "idx_signatures_expires_at" ON "signatures" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_pdf_sessions_session_id" ON "pdf_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_pdf_sessions_clerk_user_id" ON "pdf_sessions" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "idx_pdf_sessions_status" ON "pdf_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pdf_sessions_expires_at" ON "pdf_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_compress_batches_session_id" ON "compress_batches" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_compress_batches_clerk_user_id" ON "compress_batches" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "idx_compress_batches_status" ON "compress_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_compress_batches_expires_at" ON "compress_batches" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_compress_images_batch_id" ON "compress_images" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_compress_images_status" ON "compress_images" USING btree ("status");