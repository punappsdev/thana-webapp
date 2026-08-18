// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuoteRequestForm } from "@/components/quote/quote-request-form";
import type { CartItem } from "@/lib/cart";

const mocks = vi.hoisted(() => ({
  functional: false,
  clearCart: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/legal/legal-dialog", () => ({
  LegalDialog: ({ label }: { label: string }) => (
    <button type="button">{label}</button>
  ),
}));

vi.mock("@/components/consent/use-consent", () => ({
  useConsent: () => ({
    status: "decided",
    necessary: true,
    functional: mocks.functional,
    analytics: false,
    marketing: false,
    decidedAt: 1,
    expiresAt: 2,
    noticeVersion: "2026-08-18",
    hydrated: true,
  }),
}));

const cartItem: CartItem = {
  productId: 1,
  variantId: null,
  slug: "sample-product",
  nameTh: "สินค้าตัวอย่าง",
  nameEn: "Sample product",
  image: null,
  sku: null,
  qty: 1,
};

vi.mock("@/components/cart/use-cart", () => ({
  useCart: () => ({
    items: [cartItem],
    count: 1,
    hydrated: true,
    clear: mocks.clearCart,
  }),
}));

vi.mock("@/app/[locale]/quote/actions", () => ({
  submitQuoteRequest: vi.fn(async () => ({
    success: false,
    message: "",
  })),
}));

beforeEach(() => {
  mocks.functional = false;
  mocks.clearCart.mockReset();
  window.localStorage.clear();
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("QuoteRequestForm Functional consent", () => {
  it("does not overwrite in-progress fields when Functional consent is granted", () => {
    const view = render(<QuoteRequestForm />);
    const firstName = screen.getByRole("textbox", { name: /firstName/ });

    fireEvent.change(firstName, { target: { value: "Draft name" } });
    expect(firstName).toHaveValue("Draft name");

    mocks.functional = true;
    view.rerender(<QuoteRequestForm />);

    expect(screen.getByRole("textbox", { name: /firstName/ })).toHaveValue(
      "Draft name",
    );
  });
});
