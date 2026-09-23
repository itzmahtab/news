import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { categories, getCategory } from "@/lib/config/categories";
import { fetchCategoryNews } from "@/lib/api/mediastack";
import { DEFAULT_PAGE_SIZE, parsePage, totalPages } from "@/lib/pagination";
import { NewsCard } from "@/components/site/news-card";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};

  return {
    title: category.name,
    description: category.description,
    alternates: {
      canonical: `${env.SITE_URL.replace(/\/$/, "")}/${slug}`,
    },
    openGraph: {
      title: category.name,
      description: category.description,
      url: `${env.SITE_URL.replace(/\/$/, "")}/${slug}`,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category: slug } = await params;
  const { page: pageParam } = await searchParams;

  if (!categories.some((c) => c.slug === slug)) {
    notFound();
  }

  const category = getCategory(slug as (typeof categories)[number]["slug"]);
  const page = parsePage(pageParam);
  const { items, total: totalItems } = await fetchCategoryNews(
    category.slug,
    page,
    DEFAULT_PAGE_SIZE,
  );

  const pageCount = totalPages(totalItems);
  const previousDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  return (
    <main className="mx-auto flex w-full max-w-4xl grow flex-col gap-8 px-6 py-12">
      <header className="border-l-2 pl-4" style={{ borderLeftColor: category.color }}>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          {category.name}
        </h1>
        <p className="mt-1 text-muted-foreground">{category.description}</p>
      </header>

      <div className="flex flex-col gap-3">
        {items.length > 0 ? (
          items.map((item) => (
            <NewsCard
              key={item.url}
              item={item}
              categoryName={category.name}
              color={category.color}
              layout="row"
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No stories in this feed right now.
          </p>
        )}
      </div>

      <nav
        aria-label="Pagination"
        className="flex items-center justify-between border-t pt-4 text-sm"
      >
        <a
          href={previousDisabled ? undefined : `/${slug}?page=${page - 1}`}
          aria-disabled={previousDisabled}
          className={
            previousDisabled
              ? "pointer-events-none text-muted-foreground/50"
              : "text-muted-foreground transition-colors hover:text-foreground"
          }
        >
          Previous
        </a>
        <span className="text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <a
          href={nextDisabled ? undefined : `/${slug}?page=${page + 1}`}
          aria-disabled={nextDisabled}
          className={
            nextDisabled
              ? "pointer-events-none text-muted-foreground/50"
              : "text-muted-foreground transition-colors hover:text-foreground"
          }
        >
          Next
        </a>
      </nav>
    </main>
  );
}