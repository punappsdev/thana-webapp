import type { Prisma } from "../generated/prisma/client";

/**
 * Product search runs against a denormalised `Product.searchText` column matched
 * with `LIKE %term%` rather than a database full-text index.
 *
 * The catalog is MySQL/MariaDB and most of its content is Thai. Thai is written
 * without spaces between words, so InnoDB's default full-text tokeniser cannot
 * split it into terms — a `FULLTEXT` index would silently fail to match the
 * majority of the catalog. Substring matching over one pre-normalised column is
 * the approach that actually works for both languages, and at catalog scale it
 * stays fast because only a single narrow column is scanned.
 *
 * Everything in this file is pure so the indexer, the API route and the catalog
 * page all derive their terms exactly the same way.
 */

/** Longest query we will ever look at — anything beyond this is not a real search. */
export const MAX_QUERY_LENGTH = 64;

/** Cap on tokens per query, so a pathological input cannot fan out into many LIKEs. */
const MAX_QUERY_TOKENS = 6;

/**
 * Folds text into the form both sides of a comparison are stored in: lowercase,
 * composed Unicode, punctuation flattened to spaces. Flattening punctuation is
 * what lets "GL-TP-6" be found by typing "gl tp 6".
 */
export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFC")
    .toLowerCase()
    .replace(/[-_/\\.,()[\]{}#"'`~!?:;*+=<>|@$%^&]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits a query into the terms that must all be present. Thai queries usually
 * collapse to a single token; space-separated Latin queries become several, and
 * requiring all of them (AND) is what makes "sc 6" narrower than "sc".
 */
export function tokenizeQuery(query: string): string[] {
  if (!query) return [];
  const normalized = normalizeSearchText(query.slice(0, MAX_QUERY_LENGTH));
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean).slice(0, MAX_QUERY_TOKENS);
}

/** Shape `buildProductSearchText` needs — a subset of the Prisma product record. */
export interface ProductForIndex {
  nameTh: string;
  nameEn: string;
  sku: string;
  slug: string;
  brand?: { name: string } | null;
  category?: { nameTh: string; nameEn: string } | null;
  subCategory?: { nameTh: string; nameEn: string } | null;
  unit?: { nameTh: string; nameEn: string } | null;
  pricingUnit?: { nameTh: string; nameEn: string } | null;
  variants?: { sku: string | null }[];
  attributeLinks?: {
    attributeValue: {
      valueTh: string;
      valueEn: string;
      attribute: { nameTh: string; nameEn: string; unit: string | null };
    };
  }[];
}

/**
 * Flattens everything a customer might type into one searchable string:
 * names and SKU in both languages, brand, category, and the product's own
 * attribute values (thickness, colour, size…). Descriptions are deliberately
 * excluded — they are long marketing prose and matching them buries precise
 * results under vaguely-related ones.
 */
export function buildProductSearchText(product: ProductForIndex): string {
  const parts: (string | null | undefined)[] = [
    product.nameTh,
    product.nameEn,
    product.sku,
    // A second, separator-free copy so "GLTP6" also finds "GL-TP-6".
    product.sku.replace(/[^\p{L}\p{N}]+/gu, ""),
    product.slug,
    product.brand?.name,
    product.category?.nameTh,
    product.category?.nameEn,
    product.subCategory?.nameTh,
    product.subCategory?.nameEn,
    product.unit?.nameTh,
    product.unit?.nameEn,
    product.pricingUnit?.nameTh,
    product.pricingUnit?.nameEn,
  ];

  for (const variant of product.variants ?? []) {
    parts.push(variant.sku);
  }

  for (const link of product.attributeLinks ?? []) {
    const { valueTh, valueEn, attribute } = link.attributeValue;
    parts.push(valueTh, valueEn, attribute.nameTh, attribute.nameEn, attribute.unit);
  }

  return normalizeSearchText(parts.filter(Boolean).join(" "));
}

/**
 * Matches a product on any indexed field. Every token must be present, so extra
 * words narrow the result set instead of widening it.
 *
 * Note there is no `mode: "insensitive"` — the MySQL provider does not support
 * it, and the `utf8mb4_unicode_ci` collation already compares case-insensitively.
 */
export function searchTextWhere(query: string): Prisma.ProductWhereInput | undefined {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return undefined;
  return { AND: tokens.map((token) => ({ searchText: { contains: token } })) };
}

/**
 * The subset of matches that hit a product's own name or SKU, as opposed to
 * matching only through its brand or category. Used to rank "กระจกนิรภัย" above
 * every product that merely belongs to the กระจก category.
 */
export function strongMatchWhere(query: string): Prisma.ProductWhereInput | undefined {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return undefined;
  return {
    AND: tokens.map((token) => ({
      OR: [
        { nameTh: { contains: token } },
        { nameEn: { contains: token } },
        { sku: { contains: token } },
      ],
    })),
  };
}

/** Fields the relevance scorer reads. */
export interface ScorableProduct {
  nameTh: string;
  nameEn: string;
  sku: string;
  featured?: boolean;
  sortOrder?: number;
}

/**
 * Ranks an already-matched candidate set. Scoring in JS rather than SQL keeps
 * the query a single index-friendly statement, and the candidate pool is small
 * enough that the sort cost is irrelevant.
 */
export function scoreProduct(product: ScorableProduct, query: string): number {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return 0;

  const sku = normalizeSearchText(product.sku);
  const skuCompact = sku.replace(/\s+/g, "");
  const names = [normalizeSearchText(product.nameTh), normalizeSearchText(product.nameEn)];
  const phrase = tokens.join(" ");
  const phraseCompact = phrase.replace(/\s+/g, "");

  let score = 0;

  if (sku === phrase || skuCompact === phraseCompact) {
    score += 100;
  } else if (skuCompact.includes(phraseCompact)) {
    score += 30;
  }

  // Award the best single name hit rather than summing, so a product does not
  // rank higher just for carrying the same word in both languages.
  let nameScore = 0;
  for (const name of names) {
    if (!name) continue;
    if (name === phrase) nameScore = Math.max(nameScore, 80);
    else if (name.startsWith(phrase)) nameScore = Math.max(nameScore, 60);
    else if (name.includes(phrase)) nameScore = Math.max(nameScore, 40);
    else if (tokens.every((token) => name.includes(token))) nameScore = Math.max(nameScore, 25);
  }
  score += nameScore;

  // Everything reaching the scorer already matched something, so a product that
  // only matched via brand/category still outranks nothing at all.
  if (score === 0) score = 10;

  if (product.featured) score += 5;

  return score;
}

/** Sorts scored candidates: relevance, then the catalog's own ordering. */
export function compareByRelevance(
  a: ScorableProduct & { score: number },
  b: ScorableProduct & { score: number }
): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
}
