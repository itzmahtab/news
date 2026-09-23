import { describe, expect, it } from "vitest";
import {
  BACKBONE_CATEGORIES,
  backboneCategorySlugs,
  backboneCategoryToSlug,
  buildMediaStackParams,
  dedupe,
  mapMediaStackCategory,
  mediaStackCategoryLabel,
  parseMediaStackBody,
  toNewsItem,
} from "@/lib/api/mediastack-parse";

describe("buildMediaStackParams", () => {
  it("fills defaults for languages, sort, and limit", () => {
    expect(buildMediaStackParams()).toEqual({
      languages: "en",
      sort: "published_desc",
      limit: "40",
    });
  });

  it("merges and overrides extras", () => {
    expect(buildMediaStackParams({ categories: "technology", limit: "10" })).toEqual({
      languages: "en",
      sort: "published_desc",
      categories: "technology",
      limit: "10",
    });
  });
});

describe("parseMediaStackBody", () => {
  it("parses a valid payload with defaults", () => {
    const articles = parseMediaStackBody({
      data: [{ title: "Headline", url: "https://example.com/a" }],
    });
    expect(articles).toEqual([
      {
        title: "Headline",
        url: "https://example.com/a",
        description: undefined,
        source: undefined,
        image: undefined,
        category: undefined,
        published_at: undefined,
      },
    ]);
  });

  it("fills missing title with an empty string", () => {
    const articles = parseMediaStackBody({
      data: [{ url: "https://example.com/b" }],
    });
    expect(articles[0].title).toBe("");
  });

  it("throws on a malformed payload", () => {
    expect(() => parseMediaStackBody({ data: [{ url: 42 }] })).toThrow();
    expect(() => parseMediaStackBody(null)).toThrow();
  });

  it("returns an empty array when data is missing", () => {
    expect(parseMediaStackBody({})).toEqual([]);
  });
});

describe("dedupe", () => {
  it("removes duplicate urls preserving first occurrence", () => {
    const items = [
      { url: "https://x.com/1" },
      { url: "https://x.com/2" },
      { url: "https://x.com/1" },
    ];
    expect(dedupe(items)).toEqual([
      { url: "https://x.com/1" },
      { url: "https://x.com/2" },
    ]);
  });

  it("handles empty input", () => {
    expect(dedupe([])).toEqual([]);
  });
});

describe("toNewsItem", () => {
  it("maps a raw article with defaults", () => {
    const item = toNewsItem(
      { title: "T", url: "https://x.com/a", source: "Src", published_at: "2026-01-01T00:00:00Z" },
      "ai-tech",
    );
    expect(item).toEqual({
      url: "https://x.com/a",
      title: "T",
      description: "",
      sourceName: "Src",
      publishedAt: "2026-01-01T00:00:00Z",
      image: null,
      category: "ai-tech",
      mediaStackCategory: null,
    });
  });
});

describe("category mapping", () => {
  it("maps backbone categories to verticals", () => {
    expect(backboneCategoryToSlug).toMatchObject({
      technology: "ai-tech",
      business: "markets",
      sports: "sports",
      entertainment: "celebrity",
    });
    expect(BACKBONE_CATEGORIES).toEqual(["technology", "business", "sports", "entertainment"]);
    expect(backboneCategorySlugs).toEqual(
      new Set(["ai-tech", "markets", "sports", "celebrity"]),
    );
  });

  it("maps via mapMediaStackCategory with a fallback", () => {
    expect(mapMediaStackCategory("technology")).toBe("ai-tech");
    expect(mapMediaStackCategory("business")).toBe("markets");
    expect(mapMediaStackCategory("science")).toBe("ai-tech");
    expect(mapMediaStackCategory(null)).toBe("ai-tech");
  });

  it("exposes MediaStack labels for every mapped category", () => {
    for (const category of BACKBONE_CATEGORIES) {
      expect(mediaStackCategoryLabel[category]).toBeTruthy();
    }
  });
});