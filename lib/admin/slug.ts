import "server-only";

// URL slugs are generated with slugifyAdminTitle from lib/admin/validation so
// catalog matches the product/content forms — this module only adds the extra
// helpers those forms don't need (codes, fallback token, unique-error check).

/** Short uppercase alphanumeric code derived from a name (for units/pricing units). */
export function codeFromName(input: string): string {
  return input
    .normalize("NFKD")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

/** A short, reasonably-unique token used when a name produces no usable slug/code. */
export function fallbackToken(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

/** True when a Prisma write failed because of a unique-constraint collision. */
export function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}
