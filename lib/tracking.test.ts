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
  it.each(["unset", "denied"] as const)("does nothing while consent is %s", async (state) => {
    const { consent, tracking } = await loadModules();
    if (state === "denied") consent.setAnalyticsConsent("denied");

    tracking.trackQuoteLead("QT-20260818-0001");
    expect(sendGTMEvent).not.toHaveBeenCalled();
  });

  it("sends exactly one privacy-safe event per quotation code", async () => {
    const { consent, tracking } = await loadModules();
    consent.setAnalyticsConsent("granted");

    tracking.trackQuoteLead("QT-20260818-0001");
    tracking.trackQuoteLead("QT-20260818-0001");

    expect(sendGTMEvent).toHaveBeenCalledOnce();
    expect(sendGTMEvent).toHaveBeenCalledWith({ event: "generate_lead" });
  });

  it("allows a different successful quotation to generate another event", async () => {
    const { consent, tracking } = await loadModules();
    consent.setAnalyticsConsent("granted");

    tracking.trackQuoteLead("QT-20260818-0001");
    tracking.trackQuoteLead("QT-20260818-0002");

    expect(sendGTMEvent).toHaveBeenCalledTimes(2);
    expect(sendGTMEvent.mock.calls).toEqual([
      [{ event: "generate_lead" }],
      [{ event: "generate_lead" }],
    ]);
  });

  it("deduplicates across a module remount using sessionStorage", async () => {
    const first = await loadModules();
    first.consent.setAnalyticsConsent("granted");
    first.tracking.trackQuoteLead("QT-20260818-0001");

    vi.resetModules();
    const second = await loadModules();
    second.tracking.trackQuoteLead("QT-20260818-0001");

    expect(sendGTMEvent).toHaveBeenCalledOnce();
  });

  it("still deduplicates when sessionStorage is unavailable", async () => {
    const { consent, tracking } = await loadModules();
    consent.setAnalyticsConsent("granted");
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
