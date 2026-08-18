// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CONTACT_STORAGE_KEY,
  CONTACT_STORAGE_KEYS,
  emptyRememberedDetails,
  type RememberedDetails,
} from "@/lib/quote-remembered-details";
import {
  deleteRememberedDetails,
  readRememberedDetails,
  saveRememberedDetails,
} from "@/lib/quote-remembered-storage";

function details(): RememberedDetails {
  return {
    ...emptyRememberedDetails(),
    firstName: "Somchai",
    phone: "0812345678",
    fulfillmentMethod: "pickup",
    contactBranch: "thalang",
  };
}

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("remembered quote details Functional storage", () => {
  it("does not read or save without Functional consent", () => {
    window.localStorage.setItem(
      CONTACT_STORAGE_KEY,
      JSON.stringify(details()),
    );

    expect(readRememberedDetails(false)).toEqual(emptyRememberedDetails());
    expect(saveRememberedDetails(details(), false)).toBe(false);
  });

  it("round-trips current details and removes obsolete versions", () => {
    window.localStorage.setItem(CONTACT_STORAGE_KEYS[1], "obsolete");

    expect(saveRememberedDetails(details(), true)).toBe(true);
    expect(readRememberedDetails(true)).toEqual(details());
    expect(window.localStorage.getItem(CONTACT_STORAGE_KEYS[1])).toBeNull();
  });

  it("allows explicit deletion regardless of consent", () => {
    for (const key of CONTACT_STORAGE_KEYS) {
      window.localStorage.setItem(key, "saved");
    }

    expect(deleteRememberedDetails()).toBe(true);
    for (const key of CONTACT_STORAGE_KEYS) {
      expect(window.localStorage.getItem(key)).toBeNull();
    }
  });

  it("fails safely when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });

    expect(readRememberedDetails(true)).toEqual(emptyRememberedDetails());
    expect(saveRememberedDetails(details(), true)).toBe(false);
  });
});
