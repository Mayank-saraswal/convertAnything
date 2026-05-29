/** SEO metadata for all PDF tools */
export interface ToolMeta {
  slug: string;
  title: string;
  description: string;
  h1: string;
  keywords: string[];
  icon: string;
  color: string;
  acceptedTypes: string[];
  maxFiles: number;
  toolType: string;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: "merge-pdf",
    title: "Merge PDF — Combine PDF Files Free Online | ConvertAnything",
    description:
      "Merge multiple PDF files into one. No signup, no watermark. 100% free. Fast and secure.",
    h1: "Merge PDF Files",
    keywords: ["merge pdf", "combine pdf", "join pdf files", "pdf merger"],
    icon: "🔗",
    color: "#4F46E5",
    acceptedTypes: ["application/pdf"],
    maxFiles: 20,
    toolType: "merge",
  },
  {
    slug: "split-pdf",
    title: "Split PDF — Extract Pages from PDF Free | ConvertAnything",
    description:
      "Split PDF files by pages. Extract specific pages or split into individual files. Free online.",
    h1: "Split PDF Pages",
    keywords: ["split pdf", "extract pdf pages", "separate pdf"],
    icon: "✂️",
    color: "#7C3AED",
    acceptedTypes: ["application/pdf"],
    maxFiles: 1,
    toolType: "split",
  },
  {
    slug: "compress-pdf",
    title: "Compress PDF — Reduce PDF File Size Free | ConvertAnything",
    description:
      "Compress PDF files to reduce size without losing quality. Fast and free online tool.",
    h1: "Compress PDF",
    keywords: ["compress pdf", "reduce pdf size", "shrink pdf"],
    icon: "📦",
    color: "#DC2626",
    acceptedTypes: ["application/pdf"],
    maxFiles: 1,
    toolType: "compress",
  },
  {
    slug: "pdf-to-jpg",
    title: "PDF to JPG — Convert PDF to Images Free | ConvertAnything",
    description:
      "Convert PDF pages to JPG images. High quality, fast conversion. Free online.",
    h1: "PDF to JPG",
    keywords: ["pdf to jpg", "pdf to image", "convert pdf to jpeg"],
    icon: "🖼️",
    color: "#EA580C",
    acceptedTypes: ["application/pdf"],
    maxFiles: 1,
    toolType: "pdf_to_jpg",
  },
  {
    slug: "pdf-to-word",
    title: "PDF to Word — Convert PDF to DOCX Free | ConvertAnything",
    description:
      "Convert PDF files to editable Word documents. Preserves formatting. Free online.",
    h1: "PDF to Word",
    keywords: ["pdf to word", "pdf to docx", "convert pdf to word"],
    icon: "📝",
    color: "#2563EB",
    acceptedTypes: ["application/pdf"],
    maxFiles: 1,
    toolType: "pdf_to_word",
  },
  {
    slug: "word-to-pdf",
    title: "Word to PDF — Convert DOCX to PDF Free | ConvertAnything",
    description:
      "Convert Word documents to PDF. Preserves layout and formatting. Free online tool.",
    h1: "Word to PDF",
    keywords: ["word to pdf", "docx to pdf", "convert word to pdf"],
    icon: "📄",
    color: "#0891B2",
    acceptedTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxFiles: 1,
    toolType: "word_to_pdf",
  },
  {
    slug: "jpg-to-pdf",
    title: "JPG to PDF — Convert Images to PDF Free | ConvertAnything",
    description:
      "Convert JPG, PNG images to PDF. Combine multiple images into one PDF. Free online.",
    h1: "JPG to PDF",
    keywords: ["jpg to pdf", "image to pdf", "png to pdf", "photo to pdf"],
    icon: "📸",
    color: "#059669",
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFiles: 20,
    toolType: "jpg_to_pdf",
  },
  {
    slug: "rotate-pdf",
    title: "Rotate PDF — Rotate PDF Pages Free | ConvertAnything",
    description:
      "Rotate PDF pages by 90°, 180°, or 270°. Fix orientation instantly. Free online.",
    h1: "Rotate PDF",
    keywords: ["rotate pdf", "rotate pdf pages", "turn pdf"],
    icon: "🔄",
    color: "#D97706",
    acceptedTypes: ["application/pdf"],
    maxFiles: 1,
    toolType: "rotate",
  },
  {
    slug: "watermark-pdf",
    title: "Watermark PDF — Add Watermark to PDF Free | ConvertAnything",
    description:
      "Add text watermarks to PDF files. Customize position, opacity, and color. Free online.",
    h1: "Add Watermark to PDF",
    keywords: ["watermark pdf", "add watermark", "stamp pdf"],
    icon: "💧",
    color: "#6366F1",
    acceptedTypes: ["application/pdf"],
    maxFiles: 1,
    toolType: "watermark",
  },
  {
    slug: "unlock-pdf",
    title: "Unlock PDF — Remove PDF Password Free | ConvertAnything",
    description:
      "Remove password protection from PDF files. Unlock PDF for editing. Free online tool.",
    h1: "Unlock PDF",
    keywords: ["unlock pdf", "remove pdf password", "decrypt pdf"],
    icon: "🔓",
    color: "#BE185D",
    acceptedTypes: ["application/pdf"],
    maxFiles: 1,
    toolType: "unlock",
  },
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolByType(type: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.toolType === type);
}
