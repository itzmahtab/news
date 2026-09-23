import type { NewsItem } from "@/lib/api/mediastack";
import { cn } from "cn";

interface FeaturedStoryProps {
  item: NewsItem;
  categoryName: string;
  color: string;
  alignLeft: boolean;
}

export function FeaturedStory({
  item,
  categoryName,
  color,
  alignLeft,
}: FeaturedStoryProps) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="grid grid-cols-1 overflow-hidden border border-border/40 bg-card md:grid-cols-2">
        {item.image ? (
          <img
            src={item.image}
            alt=""
            loading="eager"
            className={cn(
              "aspect-video w-full object-cover md:aspect-auto",
              alignLeft ? "md:order-1" : "md:order-2",
            )}
          />
        ) : null}
        <div
          className={cn(
            "flex flex-col gap-4 p-6 md:p-10",
            alignLeft ? "md:order-2" : "md:order-1",
            !item.image && "md:col-span-2",
          )}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="uppercase tracking-wide text-muted-foreground text-xs">
              {categoryName}
            </span>
          </div>
          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            {item.title}
          </h1>
          <p className="text-muted-foreground md:max-w-prose">
            {item.description}
          </p>
          <div className="mt-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{item.sourceName}</span>
            <span>·</span>
            <span>
              {item.publishedAt
                ? new Date(item.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : ""}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}