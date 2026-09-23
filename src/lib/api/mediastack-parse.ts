import { z } from "zod";
import type { MediaStackCategory, VerticalSlug } from "@/lib/config/categories";

export interface NewsItem {
  url: string;
  title: string;
  description: string;
  sourceName: string;
  publishedAt: string | null;
  image: string | null;
  category: VerticalSlug;
  mediaStackCategory: string | null;
}

export interface RawArticle {
  title: string;
  description?: string | null;
  url: string;
  source?: string | null;
  image?: string | null;
  category?: string | null;
  published_at?: string | null;
}

const mediaStackArticleSchema = z.object({
  title: z.string().default(""),
  description: z.string().nullish(),
  url: z.string(),
  source: z.string().nullish(),
  image: z.string().nullish(),
  category: z.string().nullish(),
  published_at: z.string().nullish(),
});

export const mediaStackResponseSchema = z.object({
  data: z.array(mediaStackArticleSchema).default([]),
  pagination: z
    .object({
      total: z.number().optional(),
    })
    .optional(),
});

export const BACKBONE_CATEGORIES: MediaStackCategory[] = [
  "technology",
  "business",
  "sports",
  "entertainment",
];

export const backboneCategoryToSlug: Partial<
  Record<MediaStackCategory, VerticalSlug>
> = {
  technology: "ai-tech",
  business: "markets",
  sports: "sports",
  entertainment: "celebrity",
};

export const backboneCategorySlugs = new Set(
  Object.values(backboneCategoryToSlug),
);

export const mediaStackCategoryLabel: Record<string, string> = {
  business: "Business",
  entertainment: "Entertainment",
  general: "General",
  health: "Health",
  science: "Science",
  sports: "Sports",
  technology: "Technology",
};

export function buildMediaStackParams(
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    languages: "en",
    sort: "published_desc",
    limit: "40",
    ...extra,
  };
}

export function parseMediaStackBody(json: unknown): RawArticle[] {
  const parsed = mediaStackResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data.data;
}

export function dedupe<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

export function toNewsItem(
  article: RawArticle,
  slug: VerticalSlug,
): NewsItem {
  return {
    url: article.url,
    title: article.title,
    description: article.description ?? "",
    sourceName: article.source ?? "",
    publishedAt: article.published_at ?? null,
    image: article.image ?? null,
    category: slug,
    mediaStackCategory: article.category ?? null,
  };
}

export function mapMediaStackCategory(
  category: string | null | undefined,
): VerticalSlug {
  const slug = category
    ? backboneCategoryToSlug[category as MediaStackCategory]
    : undefined;
  return slug ?? "ai-tech";
}