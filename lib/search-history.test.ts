// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readRecentSearches,
  RECENT_SEARCHES_KEY,
  writeRecentSearches,
} from "@/lib/search-history";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("recent search Functional storage", () => {
  it("does not read or write without Functional consent", () => {
    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(["cement"]),
    );
    expect(readRecentSearches(false)).toEqual([]);

    writeRecentSearches(["steel"], false);
    expect(window.localStorage.getItem(RECENT_SEARCHES_KEY)).toBe(
      JSON.stringify(["cement"]),
    );
  });

  it("reads strings only and limits history to five entries", () => {
    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(["a", 1, "b", "c", "d", "e", "f"]),
    );

    expect(readRecentSearches(true)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("writes at most five entries and tolerates unavailable storage", () => {
    writeRecentSearches(["a", "b", "c", "d", "e", "f"], true);
    expect(JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY)!)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });
    expect(readRecentSearches(true)).toEqual([]);
    expect(() => writeRecentSearches(["a"], true)).not.toThrow();
  });
});
