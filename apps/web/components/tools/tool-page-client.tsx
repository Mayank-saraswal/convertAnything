"use client";

import { useState, useCallback } from "react";
import { FileUploader } from "~/components/tools/file-uploader";
import { ProgressTracker } from "~/components/tools/progress-tracker";
import { DownloadButton } from "~/components/tools/download-button";
import type { ToolMeta } from "~/lib/seo";

interface ToolPageClientProps {
  tool: ToolMeta;
  children?: React.ReactNode; // General children (if any)
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

        // Get presigned URL (this also generates the storage key)
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
        const { key } = presignData.result?.data || presignData;

        // Upload via API proxy (bypasses DO Spaces CORS)
        const proxyUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/trpc").replace("/trpc", "");
        const proxyRes = await fetch(`${proxyUrl}/upload-proxy/${key}`, {
          method: "PUT",
          body: file,
          headers: { 
            "Content-Type": file.type,
          },
        });

        if (!proxyRes.ok) {
          throw new Error("Failed to upload file");
        }

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
          `${apiUrl}/job.status?input=${encodeURIComponent(JSON.stringify({ jobId }))}&t=${Date.now()}`,
          { credentials: "include", cache: "no-store" }
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
      <div className="max-w-7xl mx-auto px-8 pt-24 pb-16 text-center">
        <h1 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 'clamp(36px, 5vw, 64px)',
          fontWeight: 400,
          color: '#000000',
          letterSpacing: '-1.5px',
          lineHeight: 1,
        }}>
          {tool.h1.split(' ')[0]} <em style={{ color: '#6F6F6F', fontStyle: 'italic' }}>{tool.h1.split(' ').slice(1).join(' ')}.</em>
        </h1>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          color: '#6F6F6F',
          fontSize: '16px',
          marginTop: '16px',
        }}>
          {tool.description}
        </p>
      </div>

      {/* Upload Area */}
      <FileUploader
        tool={tool}
        onFilesSelected={handleFilesSelected}
        isProcessing={status !== "idle" && status !== "completed" && status !== "failed"}
      />

      {/* Tool Options */}
      {files.length > 0 && status === "idle" && (
        <div className="mt-6">
          {children}
          
          {/* Native tool-specific options rendered on the client */}
          {tool.slug === "unlock-pdf" && (
            <div className="w-full max-w-sm mx-auto space-y-2 text-left">
              <label className="text-sm font-medium text-foreground">
                PDF Password
              </label>
              <input
                type="password"
                placeholder="Enter password..."
                value={(options.password as string) || ""}
                onChange={(e) =>
                  setOptions({ ...options, password: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                Required if the PDF cannot be opened without a password.
              </p>
            </div>
          )}

          {tool.slug === "watermark-pdf" && (
            <div className="w-full max-w-2xl mx-auto space-y-6 text-left border border-border rounded-xl p-6 bg-card shadow-sm">
              <div className="flex items-center space-x-4 mb-4 border-b border-border pb-4">
                <button
                  onClick={() => setOptions({ ...options, type: "text" })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(!options.type || options.type === "text") ? "bg-black text-white" : "bg-accent text-accent-foreground hover:bg-muted"}`}
                >
                  Text Watermark
                </button>
                <button
                  onClick={() => setOptions({ ...options, type: "image" })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${options.type === "image" ? "bg-black text-white" : "bg-accent text-accent-foreground hover:bg-muted"}`}
                >
                  Image Watermark
                </button>
              </div>

              {(!options.type || options.type === "text") ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Text</label>
                    <input
                      type="text"
                      placeholder="CONFIDENTIAL"
                      value={(options.text as string) || ""}
                      onChange={(e) => setOptions({ ...options, text: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Color</label>
                    <input
                      type="color"
                      value={(options.color as string) || "#000000"}
                      onChange={(e) => setOptions({ ...options, color: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-1 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Logo Image (PNG/JPG)</label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64String = (reader.result as string).split(',')[1];
                            setOptions({ ...options, imageBase64: base64String });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Image Scale</label>
                    <input
                      type="number"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={options.imageScale !== undefined ? (options.imageScale as number) : 0.5}
                      onChange={(e) => setOptions({ ...options, imageScale: parseFloat(e.target.value) || 0.5 })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Position</label>
                  <select
                    value={(options.position as string) || "center"}
                    onChange={(e) => setOptions({ ...options, position: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="center">Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Opacity ({Math.round((options.opacity !== undefined ? options.opacity as number : 0.3) * 100)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={options.opacity !== undefined ? (options.opacity as number) : 0.3}
                    onChange={(e) => setOptions({ ...options, opacity: parseFloat(e.target.value) || 0 })}
                    className="flex h-10 w-full accent-black"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Rotation (degrees)</label>
                  <input
                    type="number"
                    value={options.rotation !== undefined ? (options.rotation as number) : -45}
                    onChange={(e) => setOptions({ ...options, rotation: parseFloat(e.target.value) || 0 })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Process Button */}
      {files.length > 0 && status === "idle" && (
        <div className="mt-6 text-center">
          <button
            onClick={handleProcess}
            className="rounded-full bg-black px-10 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-gray-900 hover:scale-[1.02]"
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
