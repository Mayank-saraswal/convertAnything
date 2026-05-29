"use client";

import { useCallback, useState } from "react";
import type { ToolMeta } from "~/lib/seo";

interface FileUploaderProps {
  tool: ToolMeta;
  onFilesSelected: (files: File[]) => void;
  isProcessing?: boolean;
}

export function FileUploader({
  tool,
  onFilesSelected,
  isProcessing = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter((f) =>
        tool.acceptedTypes.includes(f.type)
      );
      if (validFiles.length > 0) {
        const newFiles = [...files, ...validFiles].slice(0, tool.maxFiles);
        setFiles(newFiles);
        onFilesSelected(newFiles);
      }
    },
    [files, tool, onFilesSelected]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      const newFiles = [...files, ...selectedFiles].slice(0, tool.maxFiles);
      setFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [files, tool, onFilesSelected]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [files, onFilesSelected]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]"
            : "border-border/60 bg-card/50 hover:border-indigo-500/50 hover:bg-card"
        } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        {/* Icon */}
        <div
          className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-4xl transition-transform duration-300"
          style={{
            backgroundColor: `${tool.color}15`,
          }}
        >
          {tool.icon}
        </div>

        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {files.length === 0 ? `Select ${tool.acceptedTypes.includes("application/pdf") ? "PDF" : "Image"} files` : "Add more files"}
        </h3>

        <p className="mb-4 text-sm text-muted-foreground">
          or drag & drop files here
        </p>

        <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40">
          Choose Files
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Max {tool.maxFiles} file{tool.maxFiles > 1 ? "s" : ""} • 10MB per file (free)
        </p>

        <input
          id="file-input"
          type="file"
          accept={tool.acceptedTypes.join(",")}
          multiple={tool.maxFiles > 1}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-lg">
                  📄
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
