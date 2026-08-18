export const CONSENT_STORAGE_KEY = "thana-cookie-consent-v1";
export const COOKIE_SETTINGS_EVENT = "thana:open-cookie-settings";

const CONSENT_VERSION = 1;

export type AnalyticsConsent = "unset" | "granted" | "denied";

type StoredConsent = {
  version: typeof CONSENT_VERSION;
  analytics: Exclude<AnalyticsConsent, "unset">;
};

declare global {
  interface Window {
    dataLayer?: object[];
  }
}

function parseStoredConsent(raw: string | null): AnalyticsConsent {
  if (!raw) return "unset";

  try {
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (
      parsed.version === CONSENT_VERSION &&
      (parsed.analytics === "granted" || parsed.analytics === "denied")
    ) {
      return parsed.analytics;
    }
  } catch {
    // A corrupt or obsolete preference must fail closed.
  }

  return "unset";
}

function readStoredConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return "unset";

  try {
    return parseStoredConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return "unset";
  }
}

let consent: AnalyticsConsent = readStoredConsent();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent): void {
  if (event.key !== CONSENT_STORAGE_KEY && event.key !== null) return;

  const next = parseStoredConsent(event.newValue);
  if (next === consent) return;

  const withdrawing = consent === "granted" && next !== "granted";
  consent = next;
  emit();

  if (withdrawing) {
    pushDeniedGoogleConsent();
    clearGoogleMeasurementCookies();
    window.location.reload();
  }
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

export function getConsentSnapshot(): AnalyticsConsent {
  return consent;
}

/** The server cannot read localStorage, so analytics always starts disabled. */
export function getConsentServerSnapshot(): AnalyticsConsent {
  return "unset";
}

export function setAnalyticsConsent(
  next: Exclude<AnalyticsConsent, "unset">,
): void {
  consent = next;

  if (typeof window !== "undefined") {
    const stored: StoredConsent = { version: CONSENT_VERSION, analytics: next };
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Keep the in-memory choice for this page when browser storage is blocked.
    }
  }

  emit();
}

/** Inform an already-running Google tag before the page removes it on reload. */
export function pushDeniedGoogleConsent(): void {
  if (typeof window === "undefined" || !window.dataLayer) return;

  // gtag commands are `arguments` objects. Build that same array-like shape
  // without installing a second Google script alongside GTM.
  function gtag(
    command: "consent",
    action: "update",
    parameters: Record<string, "denied">,
  ): void;
  function gtag(): void {
    // GTM expects the Arguments object produced by Google's standard snippet,
    // not an event object or a second gtag.js installation.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  }

  gtag("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
}

/** Remove first-party Analytics/Ads cookies that JavaScript is allowed to access. */
export function clearGoogleMeasurementCookies(): void {
  if (typeof document === "undefined") return;

  const names = document.cookie
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter(
      (name) =>
        name === "_ga" ||
        name.startsWith("_ga_") ||
        name === "_gid" ||
        name.startsWith("_gat") ||
        name.startsWith("_gcl_"),
    );

  if (names.length === 0) return;

  const hostname = typeof window === "undefined" ? "" : window.location.hostname;
  const hostnameParts = hostname.split(".").filter(Boolean);
  const domains = new Set<string | null>([null, hostname, hostname ? `.${hostname}` : ""]);

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

export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
