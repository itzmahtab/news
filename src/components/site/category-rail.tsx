import type { CategoryConfig } from "@/lib/config/categories";
import type { NewsItem } from "@/lib/api/mediastack";
import { NewsCard } from "@/components/site/news-card";

interface CategoryRailProps {
  category: CategoryConfig;
  items: NewsItem[];
}

export function CategoryRail({ category, items }: CategoryRailProps) {
  return (
    <section id={category.slug} className="scroll-mt-20">
      <div
        className="mb-5 border-l-2 pl-4"
        style={{ borderLeftColor: category.color }}
      >
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          {category.name}
        </h2>
        <p className="text-sm text-muted-foreground">{category.description}</p>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <NewsCard
              key={item.url}
              item={item}
              categoryName={category.name}
              color={category.color}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No stories in this feed right now.
        </p>
      )}
    </section>
  );
}