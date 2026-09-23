import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_SIZE, parsePage, totalPages } from "@/lib/pagination";

describe("parsePage", () => {
  it("defaults to 1", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("")).toBe(1);
  });

  it("clamps non-numeric and out-of-range values to 1", () => {
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-3")).toBe(1);
  });

  it("parses valid pages", () => {
    expect(parsePage("5")).toBe(5);
  });
});

describe("totalPages", () => {
  it("never reports fewer than one page", () => {
    expect(totalPages(0)).toBe(1);
  });

  it("rounds up fractional pages", () => {
    expect(totalPages(13)).toBe(2);
    expect(totalPages(1)).toBe(1);
  });

  it("respects a custom page size", () => {
    expect(totalPages(30, 10)).toBe(3);
  });

  it("defaults to the shared page size", () => {
    expect(totalPages(DEFAULT_PAGE_SIZE)).toBe(1);
  });
});