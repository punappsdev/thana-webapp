// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const modules = async () => import("@/lib/consent-store");

beforeEach(() => {
  vi.resetModules();
  window.localStorage.clear();
  window.sessionStorage.clear();
  document.cookie = "_ga=; Max-Age=0; Path=/";
  document.cookie = "_fbp=; Max-Age=0; Path=/";
  document.cookie = "unrelated=; Max-Age=0; Path=/";
  delete window.dataLayer;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("four-category consent store", () => {
  it("fails closed with a stable frozen snapshot", async () => {
    const store = await modules();
    const first = store.getConsentSnapshot();

    expect(first).toEqual({
      status: "unset",
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      decidedAt: null,
      expiresAt: null,
      noticeVersion: store.CONSENT_NOTICE_VERSION,
    });
    expect(store.getConsentSnapshot()).toBe(first);
    expect(store.getConsentServerSnapshot()).toBe(store.UNSET_CONSENT);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it("persists independent choices for 12 months and restores them", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T10:00:00.000Z"));
    const store = await modules();
    store.setConsentPreferences({
      functional: true,
      analytics: false,
      marketing: true,
    });

    const stored = JSON.parse(
      window.localStorage.getItem(store.CONSENT_STORAGE_KEY)!,
    );
    expect(stored).toMatchObject({
      version: 2,
      noticeVersion: store.CONSENT_NOTICE_VERSION,
      necessary: true,
      functional: true,
      analytics: false,
      marketing: true,
    });
    expect(stored.expiresAt - stored.decidedAt).toBe(store.CONSENT_TTL_MS);

    vi.resetModules();
    expect((await modules()).getConsentSnapshot()).toMatchObject({
      status: "decided",
      functional: true,
      analytics: false,
      marketing: true,
    });
  });

  it("re-prompts instead of extending the old Analytics-only grant", async () => {
    window.localStorage.setItem(
      "thana-cookie-consent-v1",
      JSON.stringify({ version: 1, analytics: "granted" }),
    );

    const store = await modules();
    expect(store.getConsentSnapshot()).toBe(store.UNSET_CONSENT);
    expect(window.localStorage.getItem(store.LEGACY_CONSENT_STORAGE_KEY)).toBeNull();
  });

  it("rejects corrupt, wrong-notice, and expired records", async () => {
    const initial = await modules();
    window.localStorage.setItem(initial.CONSENT_STORAGE_KEY, "not json");
    vi.resetModules();
    expect((await modules()).getConsentSnapshot().status).toBe("unset");

    const now = Date.now();
    window.localStorage.setItem(
      initial.CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        noticeVersion: "obsolete",
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true,
        decidedAt: now,
        expiresAt: now + initial.CONSENT_TTL_MS,
      }),
    );
    vi.resetModules();
    expect((await modules()).getConsentSnapshot().status).toBe("unset");

    window.localStorage.setItem(
      initial.CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        noticeVersion: initial.CONSENT_NOTICE_VERSION,
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true,
        decidedAt: now - initial.CONSENT_TTL_MS - 1,
        expiresAt: now - 1,
      }),
    );
    vi.resetModules();
    expect((await modules()).getConsentSnapshot().status).toBe("unset");
  });

  it("keeps the in-memory choice when localStorage is blocked", async () => {
    const store = await modules();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });

    store.setConsentPreferences({
      functional: false,
      analytics: true,
      marketing: false,
    });
    expect(store.getConsentSnapshot()).toMatchObject({
      status: "decided",
      analytics: true,
    });
  });

  it("updates subscribers from another tab with the v2 schema", async () => {
    const store = await modules();
    const listener = vi.fn();
    const unsubscribe = store.subscribeConsent(listener);
    const decidedAt = Date.now();

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: store.CONSENT_STORAGE_KEY,
        newValue: JSON.stringify({
          version: 2,
          noticeVersion: store.CONSENT_NOTICE_VERSION,
          necessary: true,
          functional: false,
          analytics: true,
          marketing: false,
          decidedAt,
          expiresAt: decidedAt + store.CONSENT_TTL_MS,
        }),
      }),
    );

    expect(store.getConsentSnapshot()).toMatchObject({
      status: "decided",
      analytics: true,
    });
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("clears functional data on reject but preserves the necessary cart", async () => {
    const store = await modules();
    window.localStorage.setItem("thana-quote-contact-v4", "saved");
    window.localStorage.setItem("thana:recent-searches", "saved");
    window.localStorage.setItem("thana-popup-seen-v1", "saved");
    window.localStorage.setItem("thana-quote-cart-v3", "necessary");

    store.setConsentPreferences({
      functional: false,
      analytics: false,
      marketing: false,
    });

    expect(window.localStorage.getItem("thana-quote-contact-v4")).toBeNull();
    expect(window.localStorage.getItem("thana:recent-searches")).toBeNull();
    expect(window.localStorage.getItem("thana-popup-seen-v1")).toBeNull();
    expect(window.localStorage.getItem("thana-quote-cart-v3")).toBe("necessary");
  });
});
