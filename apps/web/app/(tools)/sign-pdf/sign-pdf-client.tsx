"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileUploader } from "~/components/tools/file-uploader";
import type { ToolMeta } from "~/lib/seo";
import { trpc } from "~/trpc/client";

interface SignPdfClientProps {
  tool: ToolMeta;
}

export function SignPdfClient({ tool }: SignPdfClientProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSign = trpc.sign.requestSign.useMutation();

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
  }, []);

  const handleProcess = useCallback(async () => {
    if (files.length === 0) return;
    const file = files[0]!;

    try {
      setIsUploading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/trpc";

      // 1. Get presigned URL for upload
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

      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const presignData = await presignRes.json();
      const { uploadUrl, key } = presignData.result?.data || presignData;

      // 2. Upload to storage
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      // 3. Create signature request
      const requestRes = await requestSign.mutateAsync({
        documentBlobKey: key,
        signerEmail: "self@local.test", // Placeholder for self-signing
        placements: [], // Placements will be added in the signing room
      });

      // 4. Redirect to signing room
      router.push(`/sign-pdf/${requestRes.requestId}?token=${requestRes.oneTimeToken}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUploading(false);
    }
  }, [files, router, requestSign]);

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

      <FileUploader
        tool={tool}
        onFilesSelected={handleFilesSelected}
        isProcessing={isUploading}
      />

      {error && (
        <div className="mt-4 p-4 text-sm text-red-600 bg-red-50 rounded-lg text-center">
          {error}
        </div>
      )}

      {files.length > 0 && !isUploading && (
        <div className="mt-6 text-center">
          <button
            onClick={handleProcess}
            className="rounded-full bg-black px-10 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-gray-900 hover:scale-[1.02]"
          >
            Go to Document →
          </button>
        </div>
      )}
      {isUploading && (
        <div className="mt-6 text-center text-sm text-muted-foreground animate-pulse">
          Uploading your document...
        </div>
      )}
    </div>
  );
}
