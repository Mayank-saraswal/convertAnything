"use client";

interface DownloadButtonProps {
  downloadUrl: string | null;
  filename?: string;
  isReady: boolean;
}

export function DownloadButton({
  downloadUrl,
  filename = "output",
  isReady,
}: DownloadButtonProps) {
  if (!isReady || !downloadUrl) return null;

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-green-500/30 bg-green-500/5 p-8">
      <div className="text-5xl">🎉</div>
      <h3 className="text-xl font-bold text-foreground">
        Your file is ready!
      </h3>
      <p className="text-sm text-muted-foreground">
        Download will expire in 1 hour
      </p>
      <a
        href={downloadUrl}
        download={filename}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40 hover:brightness-110"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download File
      </a>
    </div>
  );
}
