import { describe, expect, it } from "vitest";
import {
  CLUSTER_OVERLAP_THRESHOLD,
  clusterItems,
  keywordOverlap,
  normalizeForCluster,
  type ClusterableItem,
} from "@/lib/clustering";

function newsItem(id: string, title: string): ClusterableItem {
  return { id, title };
}

describe("normalizeForCluster", () => {
  it("lowercases and strips punctuation while keeping meaningful words", () => {
    expect(normalizeForCluster("OpenAI's New Model — GPT-6!?")).toEqual([
      "openai",
      "new",
      "model",
      "gpt",
    ]);
  });

  it("drops stopwords and short tokens", () => {
    expect(normalizeForCluster("the a an of to it big cat")).toEqual([
      "big",
      "cat",
    ]);
  });

  it("handles empty and punctuation-only titles", () => {
    expect(normalizeForCluster("")).toEqual([]);
    expect(normalizeForCluster("!?!,")).toEqual([]);
  });
});

describe("keywordOverlap", () => {
  it("is symmetric", () => {
    const a = ["openai", "model", "release"];
    const b = ["openai", "model", "delay"];
    expect(keywordOverlap(a, b)).toBe(keywordOverlap(b, a));
  });

  it("returns 0 for disjoint token sets", () => {
    expect(keywordOverlap(["alpha"], ["beta"])).toBe(0);
  });

  it("returns 0 for empty input", () => {
    expect(keywordOverlap([], ["alpha"])).toBe(0);
  });

  it("measures overlap against the smaller set", () => {
    expect(keywordOverlap(["openai", "model"], ["openai", "model", "release"])).toBe(1);
  });
});

describe("clusterItems", () => {
  it("groups ten same-event articles into one cluster", () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      newsItem(`a${i}`, `OpenAI releases GPT-6 with reasoning model`),
    );
    const clusters = clusterItems(items);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].items).toHaveLength(10);
  });

  it("keeps distinct events in separate clusters", () => {
    const items = [
      newsItem("a1", "OpenAI releases GPT-6 with reasoning model"),
      newsItem("b1", "Nvidia challenges the chip market"),
      newsItem("c1", "Anime expo announces summer lineup"),
    ];
    const clusters = clusterItems(items);
    expect(clusters).toHaveLength(3);
  });

  it("keeps short generic titles separate", () => {
    const items = [
      newsItem("a1", "Breaking news today"),
      newsItem("a2", "Latest headlines now"),
      newsItem("a3", "Something happened"),
    ];
    const clusters = clusterItems(items);
    expect(clusters).toHaveLength(3);
  });

  it("is deterministic for the same input order", () => {
    const items = [
      newsItem("a1", "OpenAI releases GPT-6 with reasoning model"),
      newsItem("a2", "OpenAI unveils GPT-6 flagship model"),
      newsItem("b1", "Nvidia challenges the chip market"),
    ];
    const first = clusterItems(items).map((c) => c.items.map((i) => i.id).sort());
    const second = clusterItems(items).map((c) => c.items.map((i) => i.id).sort());
    expect(first).toEqual(second);
  });

  it("associates articles sharing enough keywords", () => {
    const items = [
      newsItem("a1", "OpenAI releases GPT-6 with reasoning model"),
      newsItem("a2", "OpenAI unveils GPT-6 flagship model"),
      newsItem("b1", "Nvidia challenges the chip market"),
    ];
    const clusters = clusterItems(items, CLUSTER_OVERLAP_THRESHOLD);
    const grouped = clusters
      .filter((c) => c.items.length > 1)
      .flatMap((c) => c.items.map((i) => i.id))
      .sort();
    expect(grouped).toEqual(["a1", "a2"]);
  });
});