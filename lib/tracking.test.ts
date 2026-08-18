// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendGTMEvent } = vi.hoisted(() => ({
  sendGTMEvent: vi.fn(),
}));

vi.mock("@next/third-parties/google", () => ({ sendGTMEvent }));

async function loadModules() {
  const consent = await import("@/lib/consent-store");
  const tracking = await import("@/lib/tracking");
  return { consent, tracking };
}

beforeEach(() => {
  vi.resetModules();
  sendGTMEvent.mockReset();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("trackQuoteLead", () => {
  it("does nothing before a choice or when Analytics is off", async () => {
    const { consent, tracking } = await loadModules();
    tracking.trackQuoteLead("QT-20260818-0001");
    consent.setConsentPreferences({
      functional: false,
      analytics: false,
      marketing: true,
    });
    tracking.trackQuoteLead("QT-20260818-0002");

    expect(sendGTMEvent).not.toHaveBeenCalled();
  });

  it("sends exactly one privacy-safe event per quotation code", async () => {
    const { consent, tracking } = await loadModules();
    consent.setConsentPreferences({
      functional: false,
      analytics: true,
      marketing: false,
    });

    tracking.trackQuoteLead("QT-20260818-0001");
    tracking.trackQuoteLead("QT-20260818-0001");

    expect(sendGTMEvent).toHaveBeenCalledOnce();
    expect(sendGTMEvent).toHaveBeenCalledWith({ event: "generate_lead" });
  });

  it("allows a different successful quotation to generate another event", async () => {
    const { consent, tracking } = await loadModules();
    consent.setConsentPreferences({
      functional: false,
      analytics: true,
      marketing: false,
    });

    tracking.trackQuoteLead("QT-20260818-0001");
    tracking.trackQuoteLead("QT-20260818-0002");

    expect(sendGTMEvent.mock.calls).toEqual([
      [{ event: "generate_lead" }],
      [{ event: "generate_lead" }],
    ]);
  });

  it("deduplicates across a module remount using sessionStorage", async () => {
    const first = await loadModules();
    first.consent.setConsentPreferences({
      functional: false,
      analytics: true,
      marketing: false,
    });
    first.tracking.trackQuoteLead("QT-20260818-0001");

    vi.resetModules();
    const second = await loadModules();
    second.tracking.trackQuoteLead("QT-20260818-0001");

    expect(sendGTMEvent).toHaveBeenCalledOnce();
  });

  it("still deduplicates when sessionStorage is unavailable", async () => {
    const { consent, tracking } = await loadModules();
    consent.setConsentPreferences({
      functional: false,
      analytics: true,
      marketing: false,
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });

    tracking.trackQuoteLead("QT-20260818-0001");
    tracking.trackQuoteLead("QT-20260818-0001");

    expect(sendGTMEvent).toHaveBeenCalledOnce();
  });
});
