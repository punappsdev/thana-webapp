import "server-only";

import { headers } from "next/headers";

/**
 * Header the reverse proxy writes the real client address into, overridable for
 * deployments that sit behind Cloudflare (`CF-Connecting-IP`) or similar.
 *
 * `X-Forwarded-For` is deliberately *not* the default. The nginx recipe almost
 * everyone copies — `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`
 * — appends the real address to whatever the caller already sent, so the first
 * entry is attacker-controlled. Keying the login throttle on it let anyone send
 * a fresh random value per request and guess passwords forever. `X-Real-IP` is
 * the safe default because the same recipe sets it to `$remote_addr`, replacing
 * anything the client supplied.
 *
 * The proxy MUST overwrite this header on every request. If nothing in front of
 * the app sets it, the per-IP throttle stands down (see `shouldThrottleLogin`)
 * and only the per-account limit applies.
 */
const CLIENT_IP_HEADER = (process.env.CLIENT_IP_HEADER || "x-real-ip").toLowerCase();

/** The caller's address, or null when no trusted header carries it. */
export async function getClientIp(): Promise<string | null> {
  const raw = (await headers()).get(CLIENT_IP_HEADER);
  const value = raw?.split(",")[0]?.trim();
  return value ? value.slice(0, 64) : null;
}
