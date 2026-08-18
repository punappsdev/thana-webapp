// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ConsentManager } from "@/components/consent/consent-manager";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import {
  CONSENT_STORAGE_KEY,
  getConsentSnapshot,
  setAnalyticsConsent,
  subscribeConsent,
} from "@/lib/consent-store";

const translations: Record<string, string> = {
  bannerAriaLabel: "Privacy and cookie choices",
  bannerTitle: "Your cookie choices",
  bannerBody: "Essential cookies keep the website working.",
  privacyPolicy: "Privacy Policy",
  accept: "Accept analytics cookies",
  reject: "Use essential cookies only",
  manage: "Cookie settings",
  dialogTitle: "Cookie settings",
  dialogBody: "You can change this choice at any time.",
  necessaryTitle: "Essential cookies",
  necessaryDescription: "Required for core features.",
  analyticsTitle: "Analytics cookies",
  analyticsDescription: "Allow anonymous usage measurement.",
  alwaysOn: "Always on",
  on: "On",
  off: "Off",
  learnMore: "Read more in our",
  save: "Save settings",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

vi.mock("@/components/legal/legal-dialog", () => ({
  LegalDialog: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));

beforeEach(() => {
  window.localStorage.clear();
  const unsubscribe = subscribeConsent(() => {});
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: CONSENT_STORAGE_KEY,
      newValue: null,
    }),
  );
  unsubscribe();
});

afterEach(() => {
  cleanup();
  // Keep the module-level store deterministic between tests without exercising
  // the real page reload used only for a user's granted → denied transition.
  setAnalyticsConsent("denied");
  vi.restoreAllMocks();
});

describe("ConsentManager", () => {
  it("shows first-visit choices and stores an analytics grant", () => {
    render(<ConsentManager />);

    expect(screen.getByRole("region", { name: translations.bannerAriaLabel })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: translations.accept }));

    expect(screen.queryByRole("region", { name: translations.bannerAriaLabel })).toBeNull();
    expect(getConsentSnapshot()).toBe("granted");
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toContain('"analytics":"granted"');
  });

  it("stores a denial from detailed settings without loading analytics", () => {
    render(<ConsentManager />);
    fireEvent.click(screen.getByRole("button", { name: translations.manage }));
    fireEvent.click(screen.getByRole("button", { name: translations.reject }));

    expect(getConsentSnapshot()).toBe("denied");
    expect(screen.queryByRole("region", { name: translations.bannerAriaLabel })).toBeNull();
  });

  it("opens detailed settings from the first-visit banner", () => {
    render(<ConsentManager />);
    fireEvent.click(screen.getByRole("button", { name: translations.manage }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: translations.dialogTitle })).toBeTruthy();
    expect(screen.getByRole("switch", { name: translations.necessaryTitle })).toBeDisabled();
    expect(screen.getByRole("switch", { name: translations.analyticsTitle })).not.toBeChecked();
  });

  it("opens with the saved grant selected", () => {
    setAnalyticsConsent("granted");
    render(
      <>
        <ConsentManager />
        <CookieSettingsButton label={translations.manage} />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: translations.manage }));
    expect(screen.getByRole("switch", { name: translations.analyticsTitle })).toBeChecked();
  });

  it("reopens settings from the persistent footer control", () => {
    render(
      <>
        <ConsentManager />
        <CookieSettingsButton label={translations.manage} />
      </>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: translations.manage }).at(-1)!);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
