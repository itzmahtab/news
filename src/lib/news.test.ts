import { describe, expect, it } from "vitest";
import { publishedMillis, rankByRecency } from "@/lib/news";
import type { NewsItem } from "@/lib/api/mediastack-parse";

function item(overrides: Partial<NewsItem>): NewsItem {
  return {
    url: "https://x.com/1",
    title: "t",
    description: "",
    sourceName: "",
    publishedAt: null,
    image: null,
    category: "ai-tech",
    mediaStackCategory: null,
    ...overrides,
  };
}

describe("publishedMillis", () => {
  it("parses an ISO date", () => {
    expect(publishedMillis("2026-09-20T08:00:00Z")).toBe(
      new Date("2026-09-20T08:00:00Z").getTime(),
    );
  });

  it("returns 0 for null", () => {
    expect(publishedMillis(null)).toBe(0);
  });

  it("returns 0 for an invalid date", () => {
    expect(publishedMillis("not-a-date")).toBe(0);
  });
});

describe("rankByRecency", () => {
  it("ranks an empty list as 0", () => {
    expect(rankByRecency([])).toBe(0);
  });

  it("returns the most recent timestamp", () => {
    const items = [
      item({ publishedAt: "2026-09-18T01:00:00Z" }),
      item({ publishedAt: "2026-09-20T01:00:00Z" }),
      item({ publishedAt: "2026-09-17T01:00:00Z" }),
    ];
    expect(rankByRecency(items)).toBe(new Date("2026-09-20T01:00:00Z").getTime());
  });

  it("ignores invalid dates in favor of valid ones", () => {
    const items = [
      item({ publishedAt: "garbage" }),
      item({ publishedAt: "2026-09-20T01:00:00Z" }),
      item({ publishedAt: "more-garbage" }),
    ];
    expect(rankByRecency(items)).toBe(new Date("2026-09-20T01:00:00Z").getTime());
  });
});