import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { categories } from "@/lib/config/categories";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.SITE_URL.replace(/\/$/, "");
  const now = new Date();

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    ...categories.map((category) => ({
      url: `${base}/${category.slug}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}