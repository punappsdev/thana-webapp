import { Prisma } from "../generated/prisma/client";
import { getPrisma } from "./prisma";
import { buildProductSearchText } from "./search";

/**
 * Keeps `Product.searchText` in step with the data it is derived from.
 *
 * The column is a cache, not a source of truth, so every write path that can
 * change a product's searchable text calls back in here: the product editor,
 * and the catalog editor for brand / category / attribute renames that fan out
 * across many products. `scripts/reindex-search.ts` rebuilds everything when
 * that is not enough.
 *
 * Deliberately free of `server-only` — the CLI reindex script imports it too.
 */

/** Exactly the relations `buildProductSearchText` reads, and nothing more. */
const INDEX_SELECT = {
  id: true,
  nameTh: true,
  nameEn: true,
  sku: true,
  slug: true,
  brand: { select: { nameTh: true, nameEn: true } },
  category: { select: { nameTh: true, nameEn: true } },
  subCategory: { select: { nameTh: true, nameEn: true } },
  unit: { select: { nameTh: true, nameEn: true } },
  pricingUnit: { select: { nameTh: true, nameEn: true } },
  variants: { select: { sku: true } },
  attributeLinks: {
    select: {
      attributeValue: {
        select: {
          valueTh: true,
          valueEn: true,
          attribute: { select: { nameTh: true, nameEn: true, unit: true } },
        },
      },
    },
  },
} satisfies Prisma.ProductSelect;

/** Products read and written per round trip — small enough to stay off the heap. */
const BATCH_SIZE = 200;

/**
 * Rebuilds the search text for the given products, or for the whole catalog
 * when no ids are passed. Returns how many rows were rewritten.
 */
export async function reindexProducts(productIds?: number[]): Promise<number> {
  const prisma = getPrisma();

  if (productIds && productIds.length === 0) return 0;

  const ids =
    productIds ??
    (await prisma.product.findMany({ select: { id: true }, orderBy: { id: "asc" } })).map(
      (row) => row.id
    );

  let written = 0;

  for (let offset = 0; offset < ids.length; offset += BATCH_SIZE) {
    const batchIds = ids.slice(offset, offset + BATCH_SIZE);
    const products = await prisma.product.findMany({
      where: { id: { in: batchIds } },
      select: INDEX_SELECT,
    });

    // Written with raw SQL rather than `product.update` on purpose: `updatedAt`
    // carries `@updatedAt`, and the admin product list is sorted by it. A
    // catalog-wide reindex must not reshuffle that list.
    await prisma.$transaction(
      products.map((product) => {
        const searchText = buildProductSearchText(product);
        return prisma.$executeRaw`UPDATE \`Product\` SET \`searchText\` = ${searchText} WHERE \`id\` = ${product.id}`;
      })
    );

    written += products.length;
  }

  return written;
}

/**
 * Reindexes every product matching a filter. Used when a shared record changes —
 * renaming a brand has to refresh each product that carries that brand's name.
 */
export async function reindexProductsWhere(where: Prisma.ProductWhereInput): Promise<number> {
  const rows = await getPrisma().product.findMany({ where, select: { id: true } });
  return reindexProducts(rows.map((row) => row.id));
}
