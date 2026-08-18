import {
  applyConsentTransition,
  clearAnalyticsCookies,
  clearFunctionalStorage,
  clearMarketingCookies,
  reloadAfterTrackingWithdrawal,
} from "@/lib/consent-effects";
import { clearLegacyLocaleCookie } from "@/lib/functional-locale";

export const CONSENT_STORAGE_KEY = "thana-cookie-consent-v2";
export const LEGACY_CONSENT_STORAGE_KEY = "thana-cookie-consent-v1";
export const COOKIE_SETTINGS_EVENT = "thana:open-cookie-settings";
export const CONSENT_NOTICE_VERSION = "2026-08-18";
export const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

const CONSENT_SCHEMA_VERSION = 2;

export type ConsentStatus = "unset" | "decided";
export type ConsentPreferences = {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};
export type ConsentSnapshot = Readonly<{
  status: ConsentStatus;
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  decidedAt: number | null;
  expiresAt: number | null;
  noticeVersion: typeof CONSENT_NOTICE_VERSION;
}>;

type StoredConsent = {
  version: typeof CONSENT_SCHEMA_VERSION;
  noticeVersion: typeof CONSENT_NOTICE_VERSION;
  decidedAt: number;
  expiresAt: number;
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

export const UNSET_CONSENT: ConsentSnapshot = Object.freeze({
  status: "unset",
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  decidedAt: null,
  expiresAt: null,
  noticeVersion: CONSENT_NOTICE_VERSION,
});

function decidedSnapshot(stored: StoredConsent): ConsentSnapshot {
  return Object.freeze({
    status: "decided",
    necessary: true,
    functional: stored.functional,
    analytics: stored.analytics,
    marketing: stored.marketing,
    decidedAt: stored.decidedAt,
    expiresAt: stored.expiresAt,
    noticeVersion: CONSENT_NOTICE_VERSION,
  });
}

function parseStoredConsent(raw: string | null, now = Date.now()): ConsentSnapshot {
  if (!raw) return UNSET_CONSENT;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (
      parsed.version === CONSENT_SCHEMA_VERSION &&
      parsed.noticeVersion === CONSENT_NOTICE_VERSION &&
      parsed.necessary === true &&
      typeof parsed.functional === "boolean" &&
      typeof parsed.analytics === "boolean" &&
      typeof parsed.marketing === "boolean" &&
      typeof parsed.decidedAt === "number" &&
      Number.isFinite(parsed.decidedAt) &&
      typeof parsed.expiresAt === "number" &&
      Number.isFinite(parsed.expiresAt) &&
      parsed.expiresAt === parsed.decidedAt + CONSENT_TTL_MS &&
      parsed.expiresAt > now
    ) {
      return decidedSnapshot(parsed as StoredConsent);
    }
  } catch {
    // A corrupt preference must fail closed.
  }

  return UNSET_CONSENT;
}

function removeStorageKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Keep the deny-by-default in-memory state when storage is blocked.
  }
}

function readStoredConsent(): ConsentSnapshot {
  if (typeof window === "undefined") return UNSET_CONSENT;

  // next-intl used this cookie before Functional consent was introduced.
  clearLegacyLocaleCookie();

  let raw: string | null = null;
  let legacyRaw: string | null = null;
  try {
    raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    legacyRaw = window.localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY);
  } catch {
    return UNSET_CONSENT;
  }

  const parsed = parseStoredConsent(raw);
  if (parsed.status === "decided") {
    removeStorageKey(LEGACY_CONSENT_STORAGE_KEY);
    return parsed;
  }

  if (raw !== null) {
    removeStorageKey(CONSENT_STORAGE_KEY);
    clearFunctionalStorage();
    clearAnalyticsCookies();
    clearMarketingCookies();
  } else if (legacyRaw !== null) {
    // The old notice covered Analytics only. Re-prompt rather than extending that
    // grant to new Functional and Marketing purposes.
    clearAnalyticsCookies();
    clearMarketingCookies();
  }

  removeStorageKey(LEGACY_CONSENT_STORAGE_KEY);
  return UNSET_CONSENT;
}

let consent = readStoredConsent();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function snapshotsEqual(left: ConsentSnapshot, right: ConsentSnapshot): boolean {
  return (
    left.status === right.status &&
    left.functional === right.functional &&
    left.analytics === right.analytics &&
    left.marketing === right.marketing &&
    left.decidedAt === right.decidedAt &&
    left.expiresAt === right.expiresAt
  );
}

function transition(next: ConsentSnapshot): void {
  if (snapshotsEqual(consent, next)) return;

  const previous = consent;
  consent = next;
  emit();

  if (applyConsentTransition(previous, next)) {
    reloadAfterTrackingWithdrawal();
  }
}

function onStorage(event: StorageEvent): void {
  if (event.key !== CONSENT_STORAGE_KEY && event.key !== null) return;
  transition(parseStoredConsent(event.newValue));
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);

  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function getConsentSnapshot(): ConsentSnapshot {
  return consent;
}

/** The server cannot read localStorage, so every optional category starts denied. */
export function getConsentServerSnapshot(): ConsentSnapshot {
  return UNSET_CONSENT;
}

export function setConsentPreferences(
  preferences: ConsentPreferences,
): ConsentSnapshot {
  const decidedAt = Date.now();
  const stored: StoredConsent = {
    version: CONSENT_SCHEMA_VERSION,
    noticeVersion: CONSENT_NOTICE_VERSION,
    decidedAt,
    expiresAt: decidedAt + CONSENT_TTL_MS,
    necessary: true,
    functional: preferences.functional,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
  };
  const next = decidedSnapshot(stored);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
      window.localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY);
    } catch {
      // Keep the in-memory choice for this page when browser storage is blocked.
    }
  }

  transition(next);
  return next;
}

export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
