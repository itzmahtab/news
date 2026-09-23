import type { Metadata } from "next";
import { categories, getCategory } from "@/lib/config/categories";
import { fetchSignalNews } from "@/lib/api/mediastack";
import { publishedMillis } from "@/lib/news";
import { NewsCard } from "@/components/site/news-card";

export const metadata: Metadata = {
  title: "Trending",
  description: "The freshest signal across all seven verticals.",
};

export default async function TrendingPage() {
  const news = await fetchSignalNews();

  const flat = categories.flatMap((category) =>
    news[category.slug].map((item) => ({
      item,
      category,
    })),
  );

  flat.sort(
    (a, b) =>
      publishedMillis(b.item.publishedAt) - publishedMillis(a.item.publishedAt),
  );
  const top = flat.slice(0, 18);

  return (
    <main className="mx-auto flex w-full max-w-6xl grow flex-col gap-8 px-6 py-12">
      <header className="border-l-2 border-signal pl-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Trending
        </h1>
        <p className="mt-1 text-muted-foreground">
          The freshest signal across all seven verticals.
        </p>
      </header>

      {top.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {top.map(({ item, category }) => (
            <NewsCard
              key={item.url}
              item={item}
              categoryName={getCategory(category.slug).name}
              color={getCategory(category.slug).color}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No stories in any feed right now.
        </p>
      )}
    </main>
  );
}