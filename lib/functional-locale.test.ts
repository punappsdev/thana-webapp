// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearLocaleCookies,
  FUNCTIONAL_LOCALE_COOKIE,
  isAppLocale,
  LEGACY_LOCALE_COOKIE,
  setFunctionalLocale,
} from "@/lib/functional-locale";

afterEach(() => {
  vi.useRealTimers();
  clearLocaleCookies();
});

describe("Functional locale preference", () => {
  it("accepts only application locales", () => {
    expect(isAppLocale("th")).toBe(true);
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("fr")).toBe(false);
    expect(isAppLocale(undefined)).toBe(false);
  });

  it("writes the preference only with a live consent expiry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T00:00:00.000Z"));

    setFunctionalLocale("en", null);
    expect(document.cookie).not.toContain(`${FUNCTIONAL_LOCALE_COOKIE}=`);

    setFunctionalLocale("en", Date.now() + 60_000);
    expect(document.cookie).toContain(`${FUNCTIONAL_LOCALE_COOKIE}=en`);
  });

  it("clears both the app and legacy next-intl cookies", () => {
    document.cookie = `${FUNCTIONAL_LOCALE_COOKIE}=en; Path=/`;
    document.cookie = `${LEGACY_LOCALE_COOKIE}=en; Path=/`;

    clearLocaleCookies();

    expect(document.cookie).not.toContain(`${FUNCTIONAL_LOCALE_COOKIE}=`);
    expect(document.cookie).not.toContain(`${LEGACY_LOCALE_COOKIE}=`);
  });
});
