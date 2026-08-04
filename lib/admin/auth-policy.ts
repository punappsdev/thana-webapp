import {
  ADMIN_SESSION_DURATION_MS,
  ADMIN_SESSION_MAX_AGE_MS,
} from "@/lib/admin/constants";

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** Failures against one email address, from anywhere, before that account locks. */
export const MAX_FAILED_LOGINS_PER_ACCOUNT = 5;

/**
 * Failures from one address across all accounts. Deliberately looser than the
 * per-account limit: a whole office behind one NAT shares this counter, so it
 * has to tolerate several people fumbling their password at once while still
 * cutting off a host spraying one password across many addresses.
 */
export const MAX_FAILED_LOGINS_PER_IP = 20;

export function isSessionExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

/**
 * `perIp` is null when the client address could not be established. The IP
 * counter is then skipped rather than defaulted: every unidentified caller
 * would otherwise share a single bucket, and a handful of bad guesses would
 * lock every administrator out of the panel at once.
 */
export function shouldThrottleLogin(attempts: {
  perAccount: number;
  perIp: number | null;
}): boolean {
  if (attempts.perAccount >= MAX_FAILED_LOGINS_PER_ACCOUNT) return true;
  return attempts.perIp !== null && attempts.perIp >= MAX_FAILED_LOGINS_PER_IP;
}

/**
 * The expiry an active session should be moved to, or null when it should be
 * left alone. Renewal waits until the session is past its half-life so browsing
 * the panel costs one write every few hours rather than one per request, and it
 * never reaches past `createdAt + ADMIN_SESSION_MAX_AGE_MS`.
 */
export function renewedSessionExpiry(
  session: { createdAt: Date; expiresAt: Date },
  now = new Date(),
): Date | null {
  const remaining = session.expiresAt.getTime() - now.getTime();
  if (remaining > ADMIN_SESSION_DURATION_MS / 2) return null;

  const ceiling = session.createdAt.getTime() + ADMIN_SESSION_MAX_AGE_MS;
  const renewed = Math.min(now.getTime() + ADMIN_SESSION_DURATION_MS, ceiling);

  // At the ceiling the "renewal" would be a no-op or a rollback; let the
  // session run out instead.
  return renewed > session.expiresAt.getTime() ? new Date(renewed) : null;
}
