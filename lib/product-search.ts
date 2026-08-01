import { Prisma } from "../generated/prisma/client";
import { getPrisma } from "./prisma";
import { strongMatchWhere } from "./search";

/**
 * Paging and ordering for the catalog grid, including relevance ordering when a
 * `q` is present.
 *
 * MySQL cannot rank `LIKE` matches, and Prisma cannot order by an expression, so
 * relevance is expressed as two disjoint buckets instead: products matching on
 * their own name or SKU, then products that matched only through a brand,
 * category or attribute. Each bucket is an ordinary indexed query, and a page is
 * filled from the first bucket before spilling into the second. The alternative —
 * raw SQL — would mean duplicating every catalog filter in a second dialect.
 */

/** Relations the product card needs. Shared so the page and this module cannot drift. */
export const CATALOG_INCLUDE = {
  category: true,
  subCategory: true,
  brand: true,
  variants: {
    include: {
      attributeValues: {
        include: { attributeValue: { include: { attribute: true } } },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export type CatalogProduct = Prisma.ProductGetPayload<{ include: typeof CATALOG_INCLUDE }>;

export interface CatalogPage {
  products: CatalogProduct[];
  totalItems: number;
  totalPages: number;
  /** The requested page clamped into range, so an out-of-range ?page= lands on the last one. */
  currentPage: number;
}

interface CatalogPageInput {
  /** Filters already applied — published, category, brand, and the q match. */
  where: Prisma.ProductWhereInput;
  /** The raw search term, or an empty string outside search. */
  query: string;
  /** The `sort` search param, if the visitor picked one. */
  sort: string | undefined;
  locale: string;
  page: number;
  pageSize: number;
}

/** The catalog's own ordering, used inside each relevance bucket too. */
const DEFAULT_ORDER: Prisma.ProductOrderByWithRelationInput[] = [
  { featured: "desc" },
  { sortOrder: "asc" },
  { createdAt: "desc" },
];

export function catalogOrderBy(
  sort: string | undefined,
  locale: string
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "name-asc":
      return [{ [locale === "th" ? "nameTh" : "nameEn"]: "asc" }];
    case "name-desc":
      return [{ [locale === "th" ? "nameTh" : "nameEn"]: "desc" }];
    default:
      return DEFAULT_ORDER;
  }
}

/**
 * True when the grid should be ordered by how well each product matches the
 * search term. Relevance is the default while searching, but an explicit name
 * sort wins — the visitor asked for that order specifically.
 */
export function usesRelevanceOrder(query: string, sort: string | undefined): boolean {
  if (!query.trim()) return false;
  return sort === undefined || sort === "" || sort === "relevance";
}

export async function findCatalogPage({
  where,
  query,
  sort,
  locale,
  page,
  pageSize,
}: CatalogPageInput): Promise<CatalogPage> {
  const prisma = getPrisma();
  const strong = usesRelevanceOrder(query, sort) ? strongMatchWhere(query) : undefined;

  if (!strong) {
    const totalItems = await prisma.product.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const products = await prisma.product.findMany({
      where,
      include: CATALOG_INCLUDE,
      orderBy: catalogOrderBy(sort, locale),
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    });
    return { products, totalItems, totalPages, currentPage };
  }

  const strongWhere: Prisma.ProductWhereInput = { AND: [where, strong] };
  const weakWhere: Prisma.ProductWhereInput = { AND: [where, { NOT: strong }] };

  const [strongCount, weakCount] = await Promise.all([
    prisma.product.count({ where: strongWhere }),
    prisma.product.count({ where: weakWhere }),
  ]);

  const totalItems = strongCount + weakCount;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const skip = (currentPage - 1) * pageSize;

  // Fill from the strong bucket first; whatever is left of the page comes from
  // the weak one, offset by however much of it earlier pages already consumed.
  const strongSkip = Math.min(skip, strongCount);
  const strongTake = Math.max(0, Math.min(pageSize, strongCount - skip));
  const weakSkip = Math.max(0, skip - strongCount);
  const weakTake = pageSize - strongTake;

  const [strongRows, weakRows] = await Promise.all([
    strongTake > 0
      ? prisma.product.findMany({
          where: strongWhere,
          include: CATALOG_INCLUDE,
          orderBy: DEFAULT_ORDER,
          skip: strongSkip,
          take: strongTake,
        })
      : Promise.resolve([]),
    weakTake > 0
      ? prisma.product.findMany({
          where: weakWhere,
          include: CATALOG_INCLUDE,
          orderBy: DEFAULT_ORDER,
          skip: weakSkip,
          take: weakTake,
        })
      : Promise.resolve([]),
  ]);

  return { products: [...strongRows, ...weakRows], totalItems, totalPages, currentPage };
}
