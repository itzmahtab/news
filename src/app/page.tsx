import type { Metadata } from "next";
import { categories } from "@/lib/config/categories";
import { fetchSignalNews } from "@/lib/api/mediastack";
import { rankByRecency } from "@/lib/news";
import { CategoryRail } from "@/components/site/category-rail";
import { SignalStrip, type StripItem } from "@/components/site/signal-strip";
import { FeaturedStory } from "@/components/site/featured-story";
import { ThemeToggle } from "@/components/site/theme-toggle";

export const metadata: Metadata = {
  title: "Signal",
  description:
    "Original, attributed news across seven verticals — AI & technology, jobs, markets, sports, celebrity, movies, and anime.",
};

export default async function Home() {
  const news = await fetchSignalNews();

  const active = categories
    .map((category) => ({ category, items: news[category.slug] }))
    .filter((entry) => entry.items.length > 0);

  const sorted = [...active].sort(
    (a, b) => rankByRecency(b.items) - rankByRecency(a.items),
  );

  const featuredEntry =
    sorted.find((entry) => entry.items.some((item) => item.image)) ?? sorted[0];
  const featured =
    featuredEntry?.items.find((item) => item.image) ?? featuredEntry?.items[0];

  const stripItems: StripItem[] = categories
    .flatMap((category) =>
      news[category.slug].map((item) => ({
        title: item.title,
        url: item.url,
        categoryName: category.name,
        color: category.color,
      })),
    )
    .slice(0, 14);

  return (
    <>
      <SignalStrip items={stripItems} />

      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <span className="font-heading text-xl font-semibold tracking-tight">
            Signal
          </span>
          <nav className="hidden gap-4 text-sm text-muted-foreground md:flex">
            {categories.map((category) => (
              <a
                key={category.slug}
                href={`#${category.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {category.name}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl grow flex-col gap-16 px-6 py-10">
        {featured ? (
          <FeaturedStory
            item={featured}
            categoryName={featuredEntry!.category.name}
            color={featuredEntry!.category.color}
            alignLeft={new Date().getDate() % 2 === 0}
          />
        ) : null}

        {sorted.map(({ category, items }) => (
          <CategoryRail key={category.slug} category={category} items={items} />
        ))}
      </main>

      <footer className="border-t px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            Signal — AI-assisted summaries linking to original reporting.
          </p>
          <ThemeToggle />
        </div>
      </footer>
    </>
  );
}