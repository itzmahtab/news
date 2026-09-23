import type { NewsItem } from "@/lib/api/mediastack-parse";

export function publishedMillis(publishedAt: string | null): number {
  const millis = publishedAt ? new Date(publishedAt).getTime() : 0;
  return Number.isNaN(millis) ? 0 : millis;
}

export function rankByRecency(items: NewsItem[]): number {
  return items.reduce(
    (latest, item) => Math.max(latest, publishedMillis(item.publishedAt)),
    0,
  );
}