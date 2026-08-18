import type { PopupFrequency } from "@/generated/prisma/client";

/**
 * Client-side "have they seen it yet?" bookkeeping for the homepage promotion
 * popup. Kept out of the component so it can be unit tested and so every storage
 * access stays wrapped — Safari private mode and a full quota both throw, and a
 * throwing popup must never take the homepage down with it.
 */

export const POPUP_SEEN_KEY = "thana-popup-seen-v1";

/**
 * Ties the dismissal to a specific version of a specific popup: editing the
 * artwork bumps `updatedAt`, which resets everyone who had already closed it.
 */
export function popupSignature(id: number, updatedAt: string): string {
  return `${id}:${updatedAt}`;
}

/** Local calendar day — ONCE_PER_DAY means "again tomorrow", not "in 24 hours". */
function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function readStore(store: "sessionStorage" | "localStorage"): string | null {
  try {
    return window[store].getItem(POPUP_SEEN_KEY);
  } catch {
    return null;
  }
}

function writeStore(store: "sessionStorage" | "localStorage", value: string): void {
  try {
    window[store].setItem(POPUP_SEEN_KEY, value);
  } catch {
    // Storage unavailable: the popup just shows again next time.
  }
}

export function shouldShowPopup(
  signature: string,
  frequency: PopupFrequency,
  functionalAllowed = true,
): boolean {
  if (typeof window === "undefined") return false;
  if (!functionalAllowed) return true;

  switch (frequency) {
    case "ALWAYS":
      return true;
    case "ONCE_PER_SESSION":
      return readStore("sessionStorage") !== signature;
    case "ONCE_PER_DAY": {
      const raw = readStore("localStorage");
      if (!raw) return true;
      const [seenSignature, seenDate] = raw.split("|");
      return seenSignature !== signature || seenDate !== today();
    }
    default:
      return true;
  }
}

export function markPopupSeen(
  signature: string,
  frequency: PopupFrequency,
  functionalAllowed = true,
): void {
  if (typeof window === "undefined" || !functionalAllowed) return;

  if (frequency === "ONCE_PER_SESSION") writeStore("sessionStorage", signature);
  else if (frequency === "ONCE_PER_DAY") writeStore("localStorage", `${signature}|${today()}`);
  // ALWAYS records nothing — that is what makes it show every time.
}

/**
 * Re-checks the schedule in the browser. The homepage is a cached RSC, so a
 * popup whose window has since closed can still be embedded in the served HTML
 * until something revalidates it.
 */
export function isWithinSchedule(startDate: string | null, endDate: string | null, now = Date.now()): boolean {
  if (startDate) {
    const start = new Date(startDate).getTime();
    if (!Number.isNaN(start) && now < start) return false;
  }
  if (endDate) {
    const end = new Date(endDate).getTime();
    if (!Number.isNaN(end) && now > end) return false;
  }
  return true;
}
