import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          View your processing history and manage your account
        </p>
      </div>

      {/* Job History */}
      <div className="rounded-2xl border border-border/50 bg-card">
        <div className="border-b border-border/40 p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Jobs
          </h2>
        </div>
        <div className="p-12 text-center text-muted-foreground">
          <div className="mb-4 text-4xl">📋</div>
          <p className="text-lg font-medium">No jobs yet</p>
          <p className="mt-1 text-sm">
            Your processed files will appear here after you sign in and use any tool.
          </p>
        </div>
      </div>
    </div>
  );
}
