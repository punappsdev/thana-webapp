import { describe, expect, it } from "vitest";
import { isSessionExpired, shouldThrottleLogin } from "@/lib/admin/auth-policy";

describe("administrator authentication policy", () => {
  it("expires sessions at their exact expiration time", () => {
    const now = new Date("2026-07-19T08:00:00.000Z");
    expect(isSessionExpired(new Date("2026-07-19T08:00:00.001Z"), now)).toBe(false);
    expect(isSessionExpired(new Date("2026-07-19T08:00:00.000Z"), now)).toBe(true);
  });

  it("throttles after five failed attempts in fifteen minutes", () => {
    expect(shouldThrottleLogin(4)).toBe(false);
    expect(shouldThrottleLogin(5)).toBe(true);
    expect(shouldThrottleLogin(20)).toBe(true);
  });
});
