export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const MAX_FAILED_LOGINS = 5;

export function isSessionExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export function shouldThrottleLogin(failedAttempts: number): boolean {
  return failedAttempts >= MAX_FAILED_LOGINS;
}
