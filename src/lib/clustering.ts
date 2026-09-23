const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "with",
]);

export const CLUSTER_OVERLAP_THRESHOLD = 0.5;
export const CLUSTER_MIN_KEYWORDS = 2;

export function normalizeForCluster(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

export function keywordOverlap(a: string[], b: string[]): number {
  const smaller = a.length <= b.length ? a : b;
  const larger = smaller === a ? b : a;
  const largerSet = new Set(larger);
  let hits = 0;
  for (const token of smaller) {
    if (largerSet.has(token)) hits++;
  }
  return smaller.length === 0 ? 0 : hits / smaller.length;
}

export interface ClusterableItem {
  id: string;
  title: string;
}

export interface Cluster<T extends ClusterableItem> {
  id: string;
  items: T[];
}

let clusterCounter = 0;

function nextClusterId(): string {
  clusterCounter += 1;
  return `cluster-${clusterCounter}`;
}

export function clusterItems<T extends ClusterableItem>(
  items: T[],
  threshold: number = CLUSTER_OVERLAP_THRESHOLD,
): Cluster<T>[] {
  const clusters: Cluster<T>[] = [];

  for (const item of items) {
    const tokens = normalizeForCluster(item.title);
    if (tokens.length < CLUSTER_MIN_KEYWORDS) {
      clusters.push({ id: nextClusterId(), items: [item] });
      continue;
    }

    let match: Cluster<T> | undefined;
    for (const cluster of clusters) {
      const representative = normalizeForCluster(cluster.items[0].title);
      if (keywordOverlap(tokens, representative) >= threshold) {
        match = cluster;
        break;
      }
    }

    if (match) {
      match.items.push(item);
    } else {
      clusters.push({ id: nextClusterId(), items: [item] });
    }
  }

  return clusters;
}