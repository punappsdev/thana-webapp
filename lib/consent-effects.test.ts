// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyConsentTransition,
  clearAnalyticsCookies,
  clearFunctionalStorage,
  clearMarketingCookies,
  googleConsentState,
  pushGoogleConsent,
} from "@/lib/consent-effects";
import {
  CONSENT_NOTICE_VERSION,
  type ConsentSnapshot,
} from "@/lib/consent-store";

function snapshot(
  overrides: Partial<ConsentSnapshot> = {},
): ConsentSnapshot {
  return {
    status: "decided",
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
    decidedAt: 1,
    expiresAt: 2,
    noticeVersion: CONSENT_NOTICE_VERSION,
    ...overrides,
  };
}

function unsetSnapshot(): ConsentSnapshot {
  return snapshot({
    status: "unset",
    decidedAt: null,
    expiresAt: null,
  });
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  delete window.dataLayer;
  document.cookie = "unrelated=keep; Path=/";
});

afterEach(() => {
  for (const part of document.cookie.split(";")) {
    const name = part.trim().split("=")[0];
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
  vi.restoreAllMocks();
});

describe("Google consent effects", () => {
  it("maps the three optional categories independently", () => {
    expect(
      googleConsentState({
        functional: true,
        analytics: false,
        marketing: true,
      }),
    ).toEqual({
      security_storage: "granted",
      functionality_storage: "granted",
      personalization_storage: "granted",
      analytics_storage: "denied",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  });

  it("queues the Arguments-shaped command expected by gtag", () => {
    pushGoogleConsent("default", {
      functional: false,
      analytics: true,
      marketing: false,
    });

    expect(window.dataLayer).toHaveLength(1);
    expect(
      Array.from(window.dataLayer![0] as ArrayLike<unknown>),
    ).toEqual([
      "consent",
      "default",
      {
        security_storage: "granted",
        functionality_storage: "denied",
        personalization_storage: "denied",
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
    ]);
  });

  it("clears only cookies that belong to each tracking category", () => {
    document.cookie = "_ga=analytics; Path=/";
    document.cookie = "_ga_ABC=analytics; Path=/";
    document.cookie = "_gid=analytics; Path=/";
    document.cookie = "_gcl_aw=marketing; Path=/";
    document.cookie = "_fbp=marketing; Path=/";
    document.cookie = "_ttp=marketing; Path=/";

    clearAnalyticsCookies();
    expect(document.cookie).not.toContain("_ga=");
    expect(document.cookie).not.toContain("_ga_ABC=");
    expect(document.cookie).not.toContain("_gid=");
    expect(document.cookie).toContain("_gcl_aw=marketing");
    expect(document.cookie).toContain("unrelated=keep");

    clearMarketingCookies();
    expect(document.cookie).not.toContain("_gcl_aw=");
    expect(document.cookie).not.toContain("_fbp=");
    expect(document.cookie).not.toContain("_ttp=");
    expect(document.cookie).toContain("unrelated=keep");
  });

  it("clears Functional preferences but preserves the quotation cart", () => {
    window.localStorage.setItem("thana-quote-contact-v4", "contact");
    window.localStorage.setItem("thana:recent-searches", "searches");
    window.localStorage.setItem("thana-popup-seen-v1", "popup");
    window.localStorage.setItem("thana-quote-cart-v3", "cart");
    window.sessionStorage.setItem("thana-popup-seen-v1", "popup");
    document.cookie = "thana-functional-locale-v1=en; Path=/";
    document.cookie = "NEXT_LOCALE=en; Path=/";

    clearFunctionalStorage();

    expect(window.localStorage.getItem("thana-quote-contact-v4")).toBeNull();
    expect(window.localStorage.getItem("thana:recent-searches")).toBeNull();
    expect(window.localStorage.getItem("thana-popup-seen-v1")).toBeNull();
    expect(window.sessionStorage.getItem("thana-popup-seen-v1")).toBeNull();
    expect(window.localStorage.getItem("thana-quote-cart-v3")).toBe("cart");
    expect(document.cookie).not.toContain("thana-functional-locale-v1=");
    expect(document.cookie).not.toContain("NEXT_LOCALE=");
  });

  it("updates Consent Mode and requests reload only when tracking is withdrawn", () => {
    const previous = snapshot({
      functional: true,
      analytics: true,
      marketing: false,
    });
    const next = snapshot({
      functional: false,
      analytics: false,
      marketing: true,
    });

    expect(applyConsentTransition(previous, next)).toBe(true);
    expect(window.dataLayer).toHaveLength(1);
    expect(
      Array.from(window.dataLayer![0] as ArrayLike<unknown>).slice(0, 2),
    ).toEqual(["consent", "update"]);
  });

  it("cleans a first rejection without loading GTM or requesting reload", () => {
    document.cookie = "_ga=legacy; Path=/";
    document.cookie = "_fbp=legacy; Path=/";
    window.localStorage.setItem("thana:recent-searches", "legacy");

    const reloadNeeded = applyConsentTransition(
      unsetSnapshot(),
      snapshot(),
    );

    expect(reloadNeeded).toBe(false);
    expect(window.dataLayer).toBeUndefined();
    expect(document.cookie).not.toContain("_ga=");
    expect(document.cookie).not.toContain("_fbp=");
    expect(window.localStorage.getItem("thana:recent-searches")).toBeNull();
  });
});
