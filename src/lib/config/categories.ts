export type MediaStackCategory =
  | "general"
  | "business"
  | "entertainment"
  | "health"
  | "science"
  | "sports"
  | "technology";

export type VerticalSlug =
  | "ai-tech"
  | "jobs"
  | "markets"
  | "sports"
  | "celebrity"
  | "movies"
  | "anime";

export interface CategoryConfig {
  slug: VerticalSlug;
  name: string;
  description: string;
  publishMode: "auto" | "review";
  color: string;
  mediaStack: {
    categories: MediaStackCategory[];
    keywords?: string;
  };
}

export const categories: CategoryConfig[] = [
  {
    slug: "ai-tech",
    name: "AI & Technology",
    description: "Artificial intelligence, software, and tech industry news.",
    publishMode: "review",
    color: "#1f5f5b",
    mediaStack: { categories: ["technology"] },
  },
  {
    slug: "jobs",
    name: "Jobs & Careers",
    description: "Hiring, layoffs, and the state of work.",
    publishMode: "review",
    color: "#8a6d3b",
    mediaStack: { categories: ["general"], keywords: "hiring,jobs,layoffs" },
  },
  {
    slug: "markets",
    name: "Markets",
    description: "Markets, business, and the economy.",
    publishMode: "review",
    color: "#46618c",
    mediaStack: { categories: ["business"] },
  },
  {
    slug: "sports",
    name: "Sports",
    description: "Sports news and results.",
    publishMode: "review",
    color: "#55805e",
    mediaStack: { categories: ["sports"] },
  },
  {
    slug: "celebrity",
    name: "Celebrity",
    description: "Celebrity and entertainment news.",
    publishMode: "review",
    color: "#7d648f",
    mediaStack: { categories: ["entertainment"] },
  },
  {
    slug: "movies",
    name: "Movies",
    description: "Film releases, trailers, and industry news.",
    publishMode: "review",
    color: "#955f44",
    mediaStack: { categories: ["entertainment"], keywords: "movie" },
  },
  {
    slug: "anime",
    name: "Anime",
    description: "Anime releases and announcements.",
    publishMode: "review",
    color: "#2e6e7e",
    mediaStack: { categories: ["entertainment"], keywords: "anime" },
  },
];

export function getCategory(slug: VerticalSlug): CategoryConfig {
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    throw new Error(`unknown category: ${slug}`);
  }
  return category;
}