"use client";

import { useState, useCallback } from "react";
import { FileUploader } from "~/components/tools/file-uploader";
import { ProgressTracker } from "~/components/tools/progress-tracker";
import { DownloadButton } from "~/components/tools/download-button";
import type { ToolMeta } from "~/lib/seo";

interface ToolPageClientProps {
  tool: ToolMeta;
  children?: React.ReactNode; // Tool-specific options
}

type Status = "idle" | "uploading" | "processing" | "completed" | "failed";

export function ToolPageClient({ tool, children }: ToolPageClientProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<Record<string, unknown>>({});

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setStatus("idle");
    setError(null);
    setDownloadUrl(null);
  }, []);

  const handleProcess = useCallback(async () => {
    if (files.length === 0) return;

    try {
      setStatus("uploading");
      setProgress(0);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/trpc";

      // Step 1: Get presigned URLs for each file
      const uploadKeys: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        setProgress(((i + 0.5) / files.length) * 50);

        // Get presigned URL
        const presignRes = await fetch(`${apiUrl}/upload.getPresignedUrl`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
          }),
        });

        if (!presignRes.ok) {
          throw new Error("Failed to get upload URL");
        }

        const presignData = await presignRes.json();
        const { uploadUrl, key } = presignData.result?.data || presignData;

        // Upload to R2
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        uploadKeys.push(key);
        setProgress(((i + 1) / files.length) * 50);
      }

      // Step 2: Confirm upload and create job
      setProgress(60);
      setStatus("processing");

      const confirmRes = await fetch(`${apiUrl}/upload.confirmUpload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          keys: uploadKeys,
          toolType: tool.toolType,
          options,
        }),
      });

      if (!confirmRes.ok) {
        throw new Error("Failed to create processing job");
      }

      const confirmData = await confirmRes.json();
      const jobId = confirmData.result?.data?.jobId || confirmData.jobId;

      // Step 3: Poll job status
      let attempts = 0;
      const maxAttempts = 120; // 4 minutes max

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const statusRes = await fetch(
          `${apiUrl}/job.status?input=${encodeURIComponent(JSON.stringify({ jobId }))}`,
          { credentials: "include" }
        );

        if (!statusRes.ok) {
          attempts++;
          continue;
        }

        const statusData = await statusRes.json();
        const jobStatus = statusData.result?.data?.status || statusData.status;

        if (jobStatus === "completed") {
          // Get download URL
          const dlRes = await fetch(`${apiUrl}/job.downloadUrl`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ jobId }),
          });

          if (dlRes.ok) {
            const dlData = await dlRes.json();
            setDownloadUrl(
              dlData.result?.data?.downloadUrl || dlData.downloadUrl
            );
          }

          setStatus("completed");
          return;
        }

        if (jobStatus === "failed") {
          setError(
            statusData.result?.data?.errorMessage || "Processing failed"
          );
          setStatus("failed");
          return;
        }

        attempts++;
      }

      setError("Processing timed out. Please try again.");
      setStatus("failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStatus("failed");
    }
  }, [files, tool, options]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Tool Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 text-5xl">{tool.icon}</div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {tool.h1}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {tool.description.split(".")[0]}.
        </p>
      </div>

      {/* Upload Area */}
      <FileUploader
        tool={tool}
        onFilesSelected={handleFilesSelected}
        isProcessing={status !== "idle" && status !== "completed" && status !== "failed"}
      />

      {/* Tool Options (injected by each tool page) */}
      {children && files.length > 0 && status === "idle" && (
        <div className="mt-6">{children}</div>
      )}

      {/* Process Button */}
      {files.length > 0 && status === "idle" && (
        <div className="mt-6 text-center">
          <button
            onClick={handleProcess}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-10 py-3.5 text-base font-semibold text-white shadow-2xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110"
          >
            {tool.h1} →
          </button>
        </div>
      )}

      {/* Progress */}
      {status !== "idle" && (
        <div className="mt-6">
          <ProgressTracker status={status} progress={progress} error={error} />
        </div>
      )}

      {/* Download */}
      {status === "completed" && (
        <div className="mt-6">
          <DownloadButton
            downloadUrl={downloadUrl}
            isReady={true}
          />
        </div>
      )}

      {/* Retry */}
      {(status === "completed" || status === "failed") && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setFiles([]);
              setStatus("idle");
              setProgress(0);
              setDownloadUrl(null);
              setError(null);
            }}
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
          >
            Process another file
          </button>
        </div>
      )}

      {/* SEO Content */}
      <section className="mt-16 space-y-6 text-sm text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">
          How to {tool.h1}
        </h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Click &quot;Choose Files&quot; or drag & drop your files above</li>
          <li>Adjust any settings if needed</li>
          <li>Click the &quot;{tool.h1}&quot; button</li>
          <li>Download your processed file</li>
        </ol>
        <p>
          All files are processed securely and automatically deleted from our
          servers after 1 hour for your privacy.
        </p>
      </section>
    </div>
  );
}
