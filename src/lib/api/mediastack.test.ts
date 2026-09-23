import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSearchNews } from "@/lib/api/mediastack";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("fetch retry handling", () => {
  it("returns articles on the first successful response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, {
          data: [{ title: "T", url: "https://x.com/1" }],
          pagination: { total: 1 },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const items = await fetchSearchNews("query");
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("T");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once after a 429 and succeeds", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, {}))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: [{ title: "T", url: "https://x.com/1" }],
          pagination: { total: 1 },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const promise = fetchSearchNews("query");
    await vi.advanceTimersByTimeAsync(3000);
    const items = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(items).toHaveLength(1);
  });

  it("returns an empty list when the retry also fails", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(429, {}));
    vi.stubGlobal("fetch", fetchMock);

    const promise = fetchSearchNews("query");
    await vi.advanceTimersByTimeAsync(3000);
    const items = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(items).toEqual([]);
  });

  it("surfaces empty results for a malformed body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { unexpected: true }));
    vi.stubGlobal("fetch", fetchMock);

    const items = await fetchSearchNews("query");
    expect(items).toEqual([]);
  });
});