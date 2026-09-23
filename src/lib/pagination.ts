export const DEFAULT_PAGE_SIZE = 12;

export function parsePage(raw: string | undefined): number {
  return Math.max(1, Number(raw ?? "1") || 1);
}

export function totalPages(
  totalItems: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}