export const FUNCTIONAL_LOCALE_COOKIE = "thana-functional-locale-v1";
export const LEGACY_LOCALE_COOKIE = "NEXT_LOCALE";

export type AppLocale = "th" | "en";

export function isAppLocale(value: string | undefined): value is AppLocale {
  return value === "th" || value === "en";
}

export function setFunctionalLocale(
  locale: AppLocale,
  expiresAt: number | null,
): void {
  if (typeof document === "undefined" || !expiresAt) return;

  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  document.cookie = `${FUNCTIONAL_LOCALE_COOKIE}=${locale}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export function clearLegacyLocaleCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LEGACY_LOCALE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export function clearLocaleCookies(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${FUNCTIONAL_LOCALE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  clearLegacyLocaleCookie();
}
