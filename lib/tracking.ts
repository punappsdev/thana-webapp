"use client";

import { sendGTMEvent } from "@next/third-parties/google";
import { getConsentSnapshot } from "@/lib/consent-store";

const QUOTE_LEAD_STORAGE_PREFIX = "thana:generate-lead:";
const trackedQuoteCodes = new Set<string>();

function storageKey(code: string): string {
  return `${QUOTE_LEAD_STORAGE_PREFIX}${code}`;
}

export function trackQuoteLead(code: string): void {
  if (typeof window === "undefined" || !getConsentSnapshot().analytics) return;

  const normalizedCode = code.trim();
  if (!normalizedCode) return;

  const key = storageKey(normalizedCode);
  if (trackedQuoteCodes.has(key)) return;

  try {
    if (window.sessionStorage.getItem(key) === "1") {
      trackedQuoteCodes.add(key);
      return;
    }
  } catch {
    // The module-level set still deduplicates while this document is open.
  }

  // Reserve the key before pushing so React effect remounts cannot race it.
  trackedQuoteCodes.add(key);
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Analytics can still run when session storage is unavailable.
  }

  sendGTMEvent({ event: "generate_lead" });
}
