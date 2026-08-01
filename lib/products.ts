import type { Prisma } from "../generated/prisma/client";

/**
 * Prisma Decimal values cannot cross the server -> client component boundary,
 * so they must be converted before being handed to any "use client" component.
 */
export function toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value : Number(value);
}

/** Picks the Thai or English variant of a `xxxTh` / `xxxEn` column pair. */
export function pick<T extends Record<string, unknown>, K extends string>(
  row: T,
  field: K,
  locale: string
): string {
  const key = `${field}${locale === "en" ? "En" : "Th"}` as keyof T;
  return (row[key] ?? "") as string;
}
