"use client";

import Link from "next/link";
import type { ToolMeta } from "~/lib/seo";

export function ToolCard({ tool }: { tool: ToolMeta }) {
  return (
    <Link
      href={`/${tool.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-xl hover:shadow-black/5"
    >
      {/* Color accent */}
      <div
        className="absolute inset-x-0 top-0 h-1 transition-all duration-300 group-hover:h-1.5"
        style={{ backgroundColor: tool.color }}
      />

      {/* Icon */}
      <div className="mb-4 text-4xl">{tool.icon}</div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-indigo-400">
        {tool.h1}
      </h3>

      {/* Description */}
      <p className="text-sm leading-relaxed text-muted-foreground">
        {tool.description.split(".")[0]}.
      </p>

      {/* Arrow */}
      <div className="mt-4 flex items-center text-sm font-medium text-indigo-400 opacity-0 transition-all duration-300 group-hover:opacity-100">
        Use tool
        <svg
          className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
