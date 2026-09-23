import { describe, expect, it } from "vitest";
import { categories } from "@/lib/config/categories";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const VALID_MEDIA_STACK_CATEGORIES = new Set([
  "technology",
  "business",
  "sports",
  "entertainment",
  "general",
]);

describe("categories config", () => {
  it("defines exactly seven verticals", () => {
    expect(categories).toHaveLength(7);
  });

  it("has unique slugs", () => {
    const slugs = categories.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every category a valid hex color", () => {
    for (const category of categories) {
      expect(category.color, category.slug).toMatch(HEX_COLOR);
    }
  });

  it("uses valid publish modes", () => {
    for (const category of categories) {
      expect(["auto", "review"]).toContain(category.publishMode);
    }
  });

  it("only references valid MediaStack categories", () => {
    for (const category of categories) {
      for (const ms of category.mediaStack.categories) {
        expect(VALID_MEDIA_STACK_CATEGORIES.has(ms), category.slug).toBe(true);
      }
    }
  });

  it("sets keywords exactly on the three keyword verticals", () => {
    const withKeywords = categories
      .filter((c) => c.mediaStack.keywords)
      .map((c) => c.slug)
      .sort();
    expect(withKeywords).toEqual(["anime", "jobs", "movies"]);
  });

  it("covers the four backbone verticals without keywords", () => {
    const backbone = categories
      .filter((c) => !c.mediaStack.keywords)
      .map((c) => c.slug)
      .sort();
    expect(backbone).toEqual(["ai-tech", "celebrity", "markets", "sports"]);
  });
});