// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

const mocks = vi.hoisted(() => ({
  googleTagManager: vi.fn(() => null),
  useConsent: vi.fn(),
  pushGoogleConsent: vi.fn(),
}));

vi.mock("@next/third-parties/google", () => ({
  GoogleTagManager: mocks.googleTagManager,
}));

vi.mock("@/components/consent/use-consent", () => ({
  useConsent: mocks.useConsent,
}));

vi.mock("@/lib/consent-effects", () => ({
  pushGoogleConsent: mocks.pushGoogleConsent,
}));

function consent(overrides: Record<string, unknown> = {}) {
  return {
    status: "decided",
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
    decidedAt: 1,
    expiresAt: 2,
    noticeVersion: "2026-08-18",
    hydrated: true,
    ...overrides,
  };
}

async function flushInitialization() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  mocks.googleTagManager.mockClear();
  mocks.pushGoogleConsent.mockClear();
  mocks.useConsent.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("AnalyticsProvider", () => {
  it("does not initialize GTM before a decision or for Functional-only consent", async () => {
    mocks.useConsent.mockReturnValue(
      consent({ status: "unset", functional: false }),
    );
    const view = render(<AnalyticsProvider />);
    await flushInitialization();

    mocks.useConsent.mockReturnValue(consent({ functional: true }));
    view.rerender(<AnalyticsProvider />);
    await flushInitialization();

    expect(mocks.pushGoogleConsent).not.toHaveBeenCalled();
    expect(mocks.googleTagManager).not.toHaveBeenCalled();
  });

  it.each([
    ["Analytics", { analytics: true }],
    ["Marketing", { marketing: true }],
  ])("initializes GTM for %s consent", async (_, enabled) => {
    const current = consent(enabled);
    mocks.useConsent.mockReturnValue(current);

    render(<AnalyticsProvider />);
    expect(mocks.pushGoogleConsent).toHaveBeenCalledWith("default", current);
    expect(mocks.googleTagManager).not.toHaveBeenCalled();

    await flushInitialization();
    expect(mocks.googleTagManager).toHaveBeenCalledWith(
      { gtmId: "GTM-K3HSCB6S" },
      undefined,
    );
  });

  it("queues the default command only once in Strict Mode", async () => {
    const current = consent({ analytics: true });
    mocks.useConsent.mockReturnValue(current);

    render(
      <StrictMode>
        <AnalyticsProvider />
      </StrictMode>,
    );
    await flushInitialization();

    expect(mocks.pushGoogleConsent).toHaveBeenCalledOnce();
    expect(mocks.pushGoogleConsent).toHaveBeenCalledWith("default", current);
  });
});
