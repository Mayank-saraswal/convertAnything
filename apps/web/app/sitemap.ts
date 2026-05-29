import type { MetadataRoute } from "next";
import { TOOLS } from "~/lib/seo";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://convertanything.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolPages = TOOLS.map((tool) => ({
    url: `${BASE_URL}/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    ...toolPages,
  ];
}
