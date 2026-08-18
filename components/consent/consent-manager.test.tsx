// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ConsentManager } from "@/components/consent/consent-manager";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import {
  CONSENT_STORAGE_KEY,
  getConsentSnapshot,
  setConsentPreferences,
  subscribeConsent,
} from "@/lib/consent-store";

vi.mock("@/lib/consent-effects", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/consent-effects")>();
  return {
    ...actual,
    reloadAfterTrackingWithdrawal: vi.fn(),
  };
});

const translations: Record<string, string> = {
  bannerAriaLabel: "Privacy and cookie choices",
  bannerTitle: "Your cookie choices",
  bannerBody: "Necessary cookies keep the website working.",
  privacyPolicy: "Privacy Policy",
  accept: "Allow cookies",
  reject: "Use necessary cookies only",
  manage: "Cookie settings",
  dialogTitle: "Cookie settings",
  dialogBody: "Choose each category.",
  necessaryTitle: "Strictly necessary cookies",
  necessaryDescription: "Required for core features.",
  functionalTitle: "Functional cookies",
  functionalDescription: "Remember preferences.",
  analyticsTitle: "Analytics and performance cookies",
  analyticsDescription: "Allow aggregate measurement.",
  marketingTitle: "Marketing and targeting cookies",
  marketingDescription: "Allow advertising tags.",
  alwaysOn: "Always on",
  on: "On",
  off: "Off",
  learnMore: "Read more in our",
  save: "Save settings",
};

vi.mock("next-intl", () => ({
  useLocale: () => "en",
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
  vi.restoreAllMocks();
});

describe("ConsentManager", () => {
  it("accepts all three optional categories from the banner", () => {
    render(<ConsentManager />);

    fireEvent.click(screen.getByRole("button", { name: translations.accept }));

    expect(getConsentSnapshot()).toMatchObject({
      status: "decided",
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  });

  it("shows Necessary as fixed and all optional categories off by default", () => {
    render(<ConsentManager />);
    fireEvent.click(screen.getByRole("button", { name: translations.manage }));

    expect(screen.getByRole("switch", { name: translations.necessaryTitle })).toBeDisabled();
    expect(screen.getByRole("switch", { name: translations.functionalTitle })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: translations.analyticsTitle })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: translations.marketingTitle })).not.toBeChecked();
  });

  it("stores granular settings independently", () => {
    render(<ConsentManager />);
    fireEvent.click(screen.getByRole("button", { name: translations.manage }));
    fireEvent.click(screen.getByRole("switch", { name: translations.functionalTitle }));
    fireEvent.click(screen.getByRole("switch", { name: translations.marketingTitle }));
    fireEvent.click(screen.getByRole("button", { name: translations.save }));

    expect(getConsentSnapshot()).toMatchObject({
      functional: true,
      analytics: false,
      marketing: true,
    });
  });

  it("rejects all optional categories from detailed settings", () => {
    render(<ConsentManager />);
    fireEvent.click(screen.getByRole("button", { name: translations.manage }));
    fireEvent.click(screen.getByRole("button", { name: translations.reject }));

    expect(getConsentSnapshot()).toMatchObject({
      status: "decided",
      functional: false,
      analytics: false,
      marketing: false,
    });
  });

  it("reopens saved settings from the footer control", () => {
    setConsentPreferences({
      functional: true,
      analytics: false,
      marketing: true,
    });
    render(
      <>
        <ConsentManager />
        <CookieSettingsButton label={translations.manage} />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: translations.manage }));
    expect(screen.getByRole("switch", { name: translations.functionalTitle })).toBeChecked();
    expect(screen.getByRole("switch", { name: translations.analyticsTitle })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: translations.marketingTitle })).toBeChecked();
  });
});
