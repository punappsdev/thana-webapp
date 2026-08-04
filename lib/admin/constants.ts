const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * The `__Host-` prefix makes the browser refuse the cookie unless it is Secure,
 * `Path=/` and carries no `Domain` — which means a compromised sibling
 * subdomain cannot overwrite the admin session. The prefix *requires* Secure,
 * and development runs over plain http, so the unprefixed name stays there.
 *
 * Changing this name invalidates existing production cookies: everyone signs in
 * once more after the deploy that ships it.
 */
export const ADMIN_SESSION_COOKIE = IS_PRODUCTION
  ? "__Host-thana_admin_session"
  : "thana_admin_session";

/** Idle window. Both the cookie and the stored session slide forward by this. */
export const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

/**
 * Hard ceiling on a session's total age. Sliding renewal keeps an active admin
 * signed in, but never past this, so a stolen token has a bounded life even if
 * the thief keeps it warm.
 */
export const ADMIN_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Shared by `lib/admin/auth.ts` (which mints the cookie) and `proxy.ts` (which
 * slides its expiry). They must agree on every attribute or the browser stores
 * two different cookies instead of updating one.
 */
export const ADMIN_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
} as const;
