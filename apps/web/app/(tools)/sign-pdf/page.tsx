import type { Metadata } from "next";
import { getToolBySlug } from "~/lib/seo";
import { SignPdfClient } from "./sign-pdf-client";

const tool = getToolBySlug("sign-pdf")!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  keywords: tool.keywords,
};

export default function SignPdfPage() {
  return <SignPdfClient tool={tool} />;
}
