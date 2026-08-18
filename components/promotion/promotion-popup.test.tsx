// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PromotionPopup } from "@/components/promotion/promotion-popup";
import {
  CONSENT_STORAGE_KEY,
  setConsentPreferences,
  subscribeConsent,
} from "@/lib/consent-store";
import { POPUP_SEEN_KEY } from "@/lib/popup-visibility";
import type { ActivePopup } from "@/lib/admin/popup-data";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

const popup: ActivePopup = {
  id: 1,
  imageUrl: "/promotion.jpg",
  width: 1200,
  height: 675,
  altTh: "โปรโมชั่น",
  altEn: "Promotion",
  linkUrl: null,
  frequency: "ONCE_PER_DAY",
  startDate: null,
  endDate: null,
  updatedAt: "2026-08-18T00:00:00.000Z",
};

beforeEach(() => {
  vi.useFakeTimers();
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
  vi.useRealTimers();
});

describe("PromotionPopup consent ordering", () => {
  it("waits while the first-visit cookie choice is unresolved", () => {
    render(<PromotionPopup popup={popup} locale="th" />);

    act(() => vi.advanceTimersByTime(1_000));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens after a decision and does not persist dismissal without Functional consent", () => {
    render(<PromotionPopup popup={popup} locale="th" />);

    act(() =>
      setConsentPreferences({
        functional: false,
        analytics: false,
        marketing: false,
      }),
    );
    act(() => vi.advanceTimersByTime(800));

    expect(screen.getByRole("dialog")).toHaveClass("z-50");
    act(() => screen.getByRole("button", { name: "close" }).click());
    expect(window.localStorage.getItem(POPUP_SEEN_KEY)).toBeNull();
  });
});
