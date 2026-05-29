import type { Metadata } from "next";
import { getToolBySlug } from "~/lib/seo";
import { ToolPageClient } from "~/components/tools/tool-page-client";

const tool = getToolBySlug("split-pdf")!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  keywords: tool.keywords,
};

export default function SplitPdfPage() {
  return <ToolPageClient tool={tool} />;
}
