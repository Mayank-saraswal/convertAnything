
import type { Metadata } from "next";


import { getToolBySlug } from "~/lib/seo";
import { ToolPageClient } from "~/components/tools/tool-page-client";

const tool = getToolBySlug("unlock-pdf")!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  keywords: tool.keywords,
};

export default function UnlockPdfPage() {
  return <ToolPageClient tool={tool} />;
}
