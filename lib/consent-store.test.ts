// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const modules = async () => import("@/lib/consent-store");

beforeEach(() => {
  vi.resetModules();
  window.localStorage.clear();
  document.cookie = "_ga=; Max-Age=0; Path=/";
  document.cookie = "_ga_TEST=; Max-Age=0; Path=/";
  document.cookie = "unrelated=; Max-Age=0; Path=/";
  delete window.dataLayer;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("analytics consent store", () => {
  it("fails closed when no valid stored preference exists", async () => {
    const store = await modules();
    expect(store.getConsentSnapshot()).toBe("unset");

    window.localStorage.setItem(store.CONSENT_STORAGE_KEY, "not json");
    vi.resetModules();
    expect((await modules()).getConsentSnapshot()).toBe("unset");
  });

  it("persists a grant and restores it in a fresh module", async () => {
    const store = await modules();
    store.setAnalyticsConsent("granted");

    expect(store.getConsentSnapshot()).toBe("granted");
    expect(JSON.parse(window.localStorage.getItem(store.CONSENT_STORAGE_KEY)!)).toEqual({
      version: 1,
      analytics: "granted",
    });

    vi.resetModules();
    expect((await modules()).getConsentSnapshot()).toBe("granted");
  });

  it("keeps the in-memory choice when localStorage is blocked", async () => {
    const store = await modules();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });

    store.setAnalyticsConsent("denied");
    expect(store.getConsentSnapshot()).toBe("denied");
  });

  it("updates subscribers when another tab changes the preference", async () => {
    const store = await modules();
    const listener = vi.fn();
    const unsubscribe = store.subscribeConsent(listener);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: store.CONSENT_STORAGE_KEY,
        newValue: JSON.stringify({ version: 1, analytics: "granted" }),
      }),
    );

    expect(store.getConsentSnapshot()).toBe("granted");
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("pushes a denied consent update to an existing Google data layer", async () => {
    const store = await modules();
    window.dataLayer = [];

    store.pushDeniedGoogleConsent();

    expect(window.dataLayer).toHaveLength(1);
    expect(Array.from(window.dataLayer![0] as ArrayLike<unknown>)).toEqual([
      "consent",
      "update",
      {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
      },
    ]);
  });

  it("removes Google measurement cookies without touching other cookies", async () => {
    const store = await modules();
    document.cookie = "_ga=base; Path=/";
    document.cookie = "_ga_TEST=stream; Path=/";
    document.cookie = "unrelated=keep; Path=/";

    store.clearGoogleMeasurementCookies();

    expect(document.cookie).not.toContain("_ga=");
    expect(document.cookie).not.toContain("_ga_TEST=");
    expect(document.cookie).toContain("unrelated=keep");
  });
});
