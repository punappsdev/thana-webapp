export const RECENT_SEARCHES_KEY = "thana:recent-searches";
const RECENT_SEARCHES_LIMIT = 5;

export function readRecentSearches(functionalAllowed: boolean): string[] {
  if (!functionalAllowed || typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed
          .filter((item): item is string => typeof item === "string")
          .slice(0, RECENT_SEARCHES_LIMIT)
      : [];
  } catch {
    // A corrupted or blocked localStorage must never break the search box.
    return [];
  }
}

export function writeRecentSearches(
  terms: string[],
  functionalAllowed: boolean,
): void {
  if (!functionalAllowed || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(terms.slice(0, RECENT_SEARCHES_LIMIT)),
    );
  } catch {
    // Private mode / quota — recent searches are a convenience, not a requirement.
  }
}
