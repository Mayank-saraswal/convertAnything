"use client";

interface ProgressTrackerProps {
  status: "idle" | "uploading" | "processing" | "completed" | "failed";
  progress?: number;
  error?: string | null;
}

const steps = [
  { key: "uploading", label: "Uploading", icon: "📤" },
  { key: "processing", label: "Processing", icon: "⚙️" },
  { key: "completed", label: "Done!", icon: "✅" },
] as const;

export function ProgressTracker({
  status,
  progress = 0,
  error,
}: ProgressTrackerProps) {
  if (status === "idle") return null;

  const currentStepIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="w-full space-y-6 rounded-2xl border border-border/50 bg-card p-6">
      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.key === status;
          const isComplete = currentStepIndex > index || status === "completed";
          const isFailed = status === "failed" && step.key === "processing";

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-all duration-500 ${
                    isFailed
                      ? "bg-destructive/10 text-destructive"
                      : isComplete
                        ? "bg-green-500/10 text-green-500 scale-110"
                        : isActive
                          ? "bg-indigo-500/10 text-indigo-500 animate-pulse"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isFailed ? "❌" : isComplete ? "✅" : step.icon}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive || isComplete
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="mx-2 mb-6 h-0.5 flex-1">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isComplete
                        ? "bg-green-500"
                        : "bg-border"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar (for uploading) */}
      {status === "uploading" && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading files...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing animation */}
      {status === "processing" && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          Processing your file...
        </div>
      )}

      {/* Error */}
      {status === "failed" && error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
