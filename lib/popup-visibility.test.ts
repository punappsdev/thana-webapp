// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isWithinSchedule,
  markPopupSeen,
  POPUP_SEEN_KEY,
  popupSignature,
  shouldShowPopup,
} from "@/lib/popup-visibility";

const SIGNATURE = popupSignature(7, "2026-08-02T03:00:00.000Z");

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("homepage promotion popup visibility", () => {
  it("always shows and never records anything for ALWAYS", () => {
    expect(shouldShowPopup(SIGNATURE, "ALWAYS")).toBe(true);
    markPopupSeen(SIGNATURE, "ALWAYS");
    expect(window.localStorage.getItem(POPUP_SEEN_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(POPUP_SEEN_KEY)).toBeNull();
    expect(shouldShowPopup(SIGNATURE, "ALWAYS")).toBe(true);
  });

  it("shows once per session and survives a new tab only via sessionStorage", () => {
    expect(shouldShowPopup(SIGNATURE, "ONCE_PER_SESSION")).toBe(true);
    markPopupSeen(SIGNATURE, "ONCE_PER_SESSION");
    expect(shouldShowPopup(SIGNATURE, "ONCE_PER_SESSION")).toBe(false);
    expect(window.localStorage.getItem(POPUP_SEEN_KEY)).toBeNull();
  });

  it("shows again the next calendar day for ONCE_PER_DAY", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 2, 10, 0, 0));
    markPopupSeen(SIGNATURE, "ONCE_PER_DAY");
    expect(shouldShowPopup(SIGNATURE, "ONCE_PER_DAY")).toBe(false);

    vi.setSystemTime(new Date(2026, 7, 2, 23, 59, 0));
    expect(shouldShowPopup(SIGNATURE, "ONCE_PER_DAY")).toBe(false);

    vi.setSystemTime(new Date(2026, 7, 3, 0, 1, 0));
    expect(shouldShowPopup(SIGNATURE, "ONCE_PER_DAY")).toBe(true);
  });

  it("shows again when the popup is edited, even on the same day", () => {
    markPopupSeen(SIGNATURE, "ONCE_PER_DAY");
    expect(shouldShowPopup(SIGNATURE, "ONCE_PER_DAY")).toBe(false);
    const edited = popupSignature(7, "2026-08-02T09:30:00.000Z");
    expect(shouldShowPopup(edited, "ONCE_PER_DAY")).toBe(true);
  });

  it("falls back to showing when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("denied"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied"); });
    expect(shouldShowPopup(SIGNATURE, "ONCE_PER_DAY")).toBe(true);
    expect(shouldShowPopup(SIGNATURE, "ONCE_PER_SESSION")).toBe(true);
    expect(() => markPopupSeen(SIGNATURE, "ONCE_PER_DAY")).not.toThrow();
  });

  it("gates on the schedule window, treating null bounds as open ended", () => {
    const now = Date.parse("2026-08-02T12:00:00.000Z");
    expect(isWithinSchedule(null, null, now)).toBe(true);
    expect(isWithinSchedule("2026-08-01T00:00:00.000Z", "2026-08-03T00:00:00.000Z", now)).toBe(true);
    expect(isWithinSchedule("2026-08-03T00:00:00.000Z", null, now)).toBe(false);
    expect(isWithinSchedule(null, "2026-08-01T00:00:00.000Z", now)).toBe(false);
    // A stored value we cannot parse must not silently hide a live popup.
    expect(isWithinSchedule("not-a-date", "not-a-date", now)).toBe(true);
  });
});
