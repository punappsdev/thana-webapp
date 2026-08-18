import { clearLocaleCookies } from "@/lib/functional-locale";
import { POPUP_SEEN_KEY } from "@/lib/popup-visibility";
import { CONTACT_STORAGE_KEYS } from "@/lib/quote-remembered-details";
import { RECENT_SEARCHES_KEY } from "@/lib/search-history";
import type { ConsentSnapshot } from "@/lib/consent-store";

export type GoogleConsentValue = "granted" | "denied";
export type GoogleConsentState = {
  security_storage: "granted";
  functionality_storage: GoogleConsentValue;
  personalization_storage: GoogleConsentValue;
  analytics_storage: GoogleConsentValue;
  ad_storage: GoogleConsentValue;
  ad_user_data: GoogleConsentValue;
  ad_personalization: GoogleConsentValue;
};

declare global {
  interface Window {
    dataLayer?: object[];
  }
}

export function googleConsentState(
  consent: Pick<ConsentSnapshot, "functional" | "analytics" | "marketing">,
): GoogleConsentState {
  return {
    security_storage: "granted",
    functionality_storage: consent.functional ? "granted" : "denied",
    personalization_storage: consent.functional ? "granted" : "denied",
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  };
}

/** Push the Arguments-shaped command expected by Google's standard gtag API. */
export function pushGoogleConsent(
  action: "default" | "update",
  consent: Pick<ConsentSnapshot, "functional" | "analytics" | "marketing">,
): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer ?? [];

  function gtag(
    command: "consent",
    commandAction: "default" | "update",
    parameters: GoogleConsentState,
  ): void;
  function gtag(): void {
    // GTM expects the Arguments object, not an event object or array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  }

  gtag("consent", action, googleConsentState(consent));
}

function cookieNames(): string[] {
  if (typeof document === "undefined") return [];
  return document.cookie
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter(Boolean);
}

function expireCookies(names: string[]): void {
  if (typeof document === "undefined" || names.length === 0) return;

  const hostname = typeof window === "undefined" ? "" : window.location.hostname;
  const hostnameParts = hostname.split(".").filter(Boolean);
  const domains = new Set<string | null>([
    null,
    hostname,
    hostname ? `.${hostname}` : "",
  ]);

  for (let index = 1; index < hostnameParts.length - 1; index += 1) {
    const parent = hostnameParts.slice(index).join(".");
    domains.add(parent);
    domains.add(`.${parent}`);
  }

  for (const name of names) {
    for (const domain of domains) {
      if (domain === "") continue;
      const domainPart = domain ? `; Domain=${domain}` : "";
      document.cookie = `${name}=; Max-Age=0; Path=/${domainPart}; SameSite=Lax`;
    }
  }
}

export function clearAnalyticsCookies(): void {
  expireCookies(
    cookieNames().filter(
      (name) =>
        name === "_ga" ||
        name.startsWith("_ga_") ||
        name === "_gid" ||
        name.startsWith("_gat"),
    ),
  );
}

export function clearMarketingCookies(): void {
  expireCookies(
    cookieNames().filter(
      (name) =>
        name.startsWith("_gcl_") ||
        name === "_fbp" ||
        name === "_fbc" ||
        name.startsWith("_fbm_") ||
        name === "_ttp" ||
        name === "_tt_enable_cookie" ||
        name.startsWith("tt_") ||
        name.startsWith("_tt_"),
    ),
  );
}

export function clearFunctionalStorage(): void {
  clearLocaleCookies();
  if (typeof window === "undefined") return;

  const localKeys = [
    ...CONTACT_STORAGE_KEYS,
    RECENT_SEARCHES_KEY,
    POPUP_SEEN_KEY,
  ];

  for (const key of localKeys) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Continue clearing the remaining stores when one browser API is blocked.
    }
  }

  try {
    window.sessionStorage.removeItem(POPUP_SEEN_KEY);
  } catch {
    // The preference simply expires with the tab if sessionStorage is blocked.
  }
}

/**
 * Apply side effects after a saved choice changes. Third-party or HttpOnly cookies
 * on Google, Meta, or TikTok origins cannot be removed by this website; preventing
 * those tags from firing in GTM is therefore required in addition to this cleanup.
 */
export function applyConsentTransition(
  previous: ConsentSnapshot,
  next: ConsentSnapshot,
): boolean {
  const firstDecision =
    previous.status === "unset" && next.status === "decided";
  const trackingWasLoaded = previous.analytics || previous.marketing;
  const withdrewAnalytics = previous.analytics && !next.analytics;
  const withdrewMarketing = previous.marketing && !next.marketing;

  if (!next.functional && (previous.functional || firstDecision)) {
    clearFunctionalStorage();
  }

  if (!next.analytics && (withdrewAnalytics || firstDecision)) {
    clearAnalyticsCookies();
  }

  if (!next.marketing && (withdrewMarketing || firstDecision)) {
    clearMarketingCookies();
  }

  if (trackingWasLoaded) {
    pushGoogleConsent("update", next);
  }

  return withdrewAnalytics || withdrewMarketing;
}

export function reloadAfterTrackingWithdrawal(): void {
  if (typeof window !== "undefined") window.location.reload();
}
