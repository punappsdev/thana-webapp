import type { Prisma } from "../generated/prisma/client";

/**
 * Prisma Decimal values cannot cross the server -> client component boundary,
 * so they must be converted before being handed to any "use client" component.
 */
export function toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value : Number(value);
}

export function formatPrice(value: number | null, locale: string): string | null {
  if (value === null) return null;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
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

/** Lowest and highest variant price for a product, for listing cards. */
export function priceRange(variants: { price: Prisma.Decimal | number }[]): {
  min: number;
  max: number;
} | null {
  if (variants.length === 0) return null;
  const prices = variants.map((v) => Number(v.price));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
