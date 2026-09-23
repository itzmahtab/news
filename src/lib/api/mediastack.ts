import { env } from "@/lib/env";
import {
  categories,
  getCategory,
  type MediaStackCategory,
  type VerticalSlug,
} from "@/lib/config/categories";
import {
  BACKBONE_CATEGORIES,
  backboneCategorySlugs,
  backboneCategoryToSlug,
  buildMediaStackParams,
  dedupe,
  mapMediaStackCategory,
  parseMediaStackBody,
  toNewsItem,
  type NewsItem,
  type RawArticle,
} from "@/lib/api/mediastack-parse";

export type { NewsItem };

interface MediaStackPage {
  articles: RawArticle[];
  total: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMediaStackPage(
  params: Record<string, string>,
): Promise<MediaStackPage> {
  let lastStatus = 0;

  for (const attempt of [0, 1]) {
    const search = new URLSearchParams({
      access_key: env.MEDIA_STACK,
      ...buildMediaStackParams(params),
    });

    const response = await fetch(
      `https://api.mediastack.com/v1/news?${search}`,
      { next: { revalidate: env.REVALIDATE_SECONDS } },
    );

    if (!response.ok) {
      lastStatus = response.status;
      if (response.status === 429 && attempt === 0) {
        await sleep(2500);
        continue;
      }
      console.error("[mediastack] request failed:", response.status);
      return { articles: [], total: 0 };
    }

    const json = await response.json();
    try {
      const articles = parseMediaStackBody(json);
      const parsedJson = json as { pagination?: { total?: number } };
      return {
        articles,
        total: parsedJson.pagination?.total ?? 0,
      };
    } catch (error) {
      console.error("[mediastack] response schema failed:", error);
      return { articles: [], total: 0 };
    }
  }

  console.error("[mediastack] request failed after retry:", lastStatus);
  return { articles: [], total: 0 };
}

export async function fetchBackboneNews(): Promise<
  Map<VerticalSlug, NewsItem[]>
> {
  const { articles } = await fetchMediaStackPage({
    categories: BACKBONE_CATEGORIES.join(","),
  });

  const map = new Map<VerticalSlug, NewsItem[]>();
  for (const article of articles) {
    const slug = article.category
      ? backboneCategoryToSlug[article.category as MediaStackCategory]
      : undefined;
    if (!slug) continue;
    const items = map.get(slug) ?? [];
    items.push(toNewsItem(article, slug));
    map.set(slug, items);
  }

  for (const [slug, items] of map) {
    map.set(slug, dedupe(items));
  }

  return map;
}

async function fetchKeywordVertical(slug: VerticalSlug): Promise<NewsItem[]> {
  const config = getCategory(slug);
  const { articles } = await fetchMediaStackPage({
    categories: [...config.mediaStack.categories].join(","),
    keywords: config.mediaStack.keywords ?? "",
    limit: "10",
  });

  return dedupe(articles.map((article) => toNewsItem(article, slug)));
}

export async function fetchSignalNews(): Promise<
  Record<VerticalSlug, NewsItem[]>
> {
  const result = Object.fromEntries(
    categories.map((category) => [category.slug, [] as NewsItem[]]),
  ) as Record<VerticalSlug, NewsItem[]>;

  const keywordSlugs = categories
    .filter((category) => category.mediaStack.keywords)
    .map((category) => category.slug);

  const backbone = await fetchBackboneNews();
  for (const [slug, items] of backbone) {
    result[slug] = items;
  }

  for (const slug of keywordSlugs) {
    await sleep(2500);
    result[slug] = await fetchKeywordVertical(slug);
  }

  return result;
}

export async function fetchCategoryNews(
  slug: VerticalSlug,
  page = 1,
  pageSize = 12,
): Promise<{ items: NewsItem[]; total: number }> {
  const config = getCategory(slug);

  if (backboneCategorySlugs.has(slug) && page === 1) {
    const backbone = await fetchBackboneNews();
    const items = backbone.get(slug) ?? [];
    return { items, total: items.length };
  }

  if (page > 1) {
    await sleep(2500);
  }

  const { articles, total } = await fetchMediaStackPage({
    categories: [...config.mediaStack.categories].join(","),
    ...(config.mediaStack.keywords
      ? { keywords: config.mediaStack.keywords }
      : {}),
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });

  return {
    items: dedupe(articles.map((article) => toNewsItem(article, slug))),
    total,
  };
}

export async function fetchSearchNews(
  query: string,
): Promise<NewsItem[]> {
  const { articles } = await fetchMediaStackPage({
    search: query,
    limit: "20",
  });

  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const article of articles) {
    if (seen.has(article.url)) continue;
    seen.add(article.url);
    items.push(toNewsItem(article, mapMediaStackCategory(article.category)));
  }

  return items;
}