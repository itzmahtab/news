import { cn } from "cn";
import type { NewsItem } from "@/lib/api/mediastack";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function publishedTime(publishedAt: string | null): string {
  if (!publishedAt) return "";
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface NewsCardProps {
  item: NewsItem;
  categoryName: string;
  color: string;
  layout?: "card" | "row";
  label?: string;
}

export function NewsCard({
  item,
  categoryName,
  color,
  layout = "card",
  label,
}: NewsCardProps) {
  const displayLabel = label ?? categoryName;

  if (layout === "row") {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Card size="sm" className="flex-col border-l-2 sm:flex-row">
          {item.image ? (
            <img
              src={item.image}
              alt=""
              loading="lazy"
              className="aspect-video w-full object-cover sm:aspect-auto sm:w-44 sm:shrink-0"
            />
          ) : null}
          <div className="flex grow flex-col gap-2 p-(--card-spacing)">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium" style={{ color }}>
                {displayLabel}
              </span>
              <span className="line-clamp-1">{item.sourceName}</span>
              {publishedTime(item.publishedAt) ? (
                <time dateTime={item.publishedAt ?? undefined}>
                  {publishedTime(item.publishedAt)}
                </time>
              ) : null}
            </div>
            <CardTitle className="line-clamp-2 font-heading text-base sm:text-lg">
              {item.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {item.description}
            </CardDescription>
          </div>
        </Card>
      </a>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full"
    >
      <Card
        size="sm"
        className="h-full border-l-2"
        style={{ borderLeftColor: color }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className="aspect-video w-full object-cover"
          />
        ) : null}
        <CardContent className="flex grow flex-col gap-2">
          <CardTitle className="line-clamp-3 font-heading">
            {item.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {item.description}
          </CardDescription>
        </CardContent>
        <CardFooter className="gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{displayLabel}</Badge>
          <span className="line-clamp-1">{item.sourceName}</span>
          {publishedTime(item.publishedAt) ? (
            <time dateTime={item.publishedAt ?? undefined}>
              {publishedTime(item.publishedAt)}
            </time>
          ) : null}
        </CardFooter>
      </Card>
    </a>
  );
}