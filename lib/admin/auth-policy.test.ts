import { describe, expect, it } from "vitest";
import {
  isSessionExpired,
  renewedSessionExpiry,
  shouldThrottleLogin,
} from "@/lib/admin/auth-policy";
import {
  ADMIN_SESSION_DURATION_MS,
  ADMIN_SESSION_MAX_AGE_MS,
} from "@/lib/admin/constants";

const NOW = new Date("2026-07-19T08:00:00.000Z");

describe("administrator authentication policy", () => {
  it("expires sessions at their exact expiration time", () => {
    expect(isSessionExpired(new Date("2026-07-19T08:00:00.001Z"), NOW)).toBe(false);
    expect(isSessionExpired(new Date("2026-07-19T08:00:00.000Z"), NOW)).toBe(true);
  });

  it("throttles after five failed attempts against one account", () => {
    expect(shouldThrottleLogin({ perAccount: 4, perIp: 0 })).toBe(false);
    expect(shouldThrottleLogin({ perAccount: 5, perIp: 0 })).toBe(true);
  });

  it("throttles a single address spraying many accounts", () => {
    expect(shouldThrottleLogin({ perAccount: 0, perIp: 19 })).toBe(false);
    expect(shouldThrottleLogin({ perAccount: 0, perIp: 20 })).toBe(true);
  });

  it("never lets an unknown address lock the login page for everyone", () => {
    expect(shouldThrottleLogin({ perAccount: 0, perIp: null })).toBe(false);
    // The per-account limit still applies when the address is unknown.
    expect(shouldThrottleLogin({ perAccount: 5, perIp: null })).toBe(true);
  });

  it("leaves a freshly issued session alone", () => {
    const session = {
      createdAt: NOW,
      expiresAt: new Date(NOW.getTime() + ADMIN_SESSION_DURATION_MS),
    };
    expect(renewedSessionExpiry(session, NOW)).toBeNull();
  });

  it("slides a session forward once it is past its half-life", () => {
    const session = {
      createdAt: new Date(NOW.getTime() - ADMIN_SESSION_DURATION_MS),
      expiresAt: new Date(NOW.getTime() + ADMIN_SESSION_DURATION_MS / 2 - 1),
    };
    expect(renewedSessionExpiry(session, NOW)).toEqual(
      new Date(NOW.getTime() + ADMIN_SESSION_DURATION_MS),
    );
  });

  it("never renews past the absolute maximum age", () => {
    const createdAt = new Date(NOW.getTime() - ADMIN_SESSION_MAX_AGE_MS + 60_000);
    const session = { createdAt, expiresAt: new Date(NOW.getTime() + 1000) };
    expect(renewedSessionExpiry(session, NOW)).toEqual(
      new Date(createdAt.getTime() + ADMIN_SESSION_MAX_AGE_MS),
    );
  });

  it("stops renewing once the ceiling is reached", () => {
    const createdAt = new Date(NOW.getTime() - ADMIN_SESSION_MAX_AGE_MS);
    const session = { createdAt, expiresAt: new Date(NOW.getTime() + 1000) };
    expect(renewedSessionExpiry(session, NOW)).toBeNull();
  });
});
