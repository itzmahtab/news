import type { Metadata } from "next";
import { env } from "@/lib/env";
import { fetchSearchNews } from "@/lib/api/mediastack";
import { mediaStackCategoryLabel } from "@/lib/api/mediastack-parse";
import { NewsCard } from "@/components/site/news-card";
import { getCategory } from "@/lib/config/categories";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const metadata: Metadata = {
  title: "Search",
  description: "Search the latest signal across all seven verticals.",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim();

  const items = query ? await fetchSearchNews(query) : [];

  return (
    <main className="mx-auto flex w-full max-w-4xl grow flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Search
        </h1>
        <form action="/search" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search the latest signal…"
            className="w-full rounded-sm border border-input bg-card px-4 py-2 text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
          />
          <button
            type="submit"
            className="rounded-sm bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </form>
      </header>

      {query ? (
        <section className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {items.length} result{items.length === 1 ? "" : "s"} for “{query}”
          </p>
          {items.length > 0 ? (
            items.map((item) => (
              <NewsCard
                key={item.url}
                item={item}
                categoryName={getCategory(item.category).name}
                color={getCategory(item.category).color}
                layout="row"
                label={
                  item.mediaStackCategory
                    ? mediaStackCategoryLabel[item.mediaStackCategory]
                    : getCategory(item.category).name
                }
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No results for “{query}”.
            </p>
          )}
        </section>
      ) : null}
    </main>
  );
}