import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Which promotions apply to a product on its detail page.
 *
 * A promotion is bound to the catalog from the admin panel and matches on an OR
 * of four independent rules — "every product", its main category, its
 * sub-category, or the product itself — so one promotion can cover a whole
 * category and still pick up a stray product outside it.
 */

/** Only the columns the promotion cards actually render. */
export const PRODUCT_PROMOTION_SELECT = {
  id: true,
  slug: true,
  titleTh: true,
  titleEn: true,
  excerptTh: true,
  excerptEn: true,
  coverImage: true,
  endDate: true,
} satisfies Prisma.PromotionSelect;

export type ProductPromotion = Prisma.PromotionGetPayload<{
  select: typeof PRODUCT_PROMOTION_SELECT;
}>;

export type PromotionTargetProduct = {
  id: number;
  categoryId: number | null;
  subCategoryId: number | null;
};

/** How many promotion cards a single product page will ever show. */
const MAX_PROMOTIONS_PER_PRODUCT = 6;

/**
 * Split out from the query so the matching rules can be unit tested without a
 * database. Unlike the /news listing — which deliberately keeps expired
 * promotions visible as an archive — the product page filters the schedule for
 * real: an offer shown next to a "request a quote" button has to be claimable.
 */
export function productPromotionWhere(
  product: PromotionTargetProduct,
  now: Date
): Prisma.PromotionWhereInput {
  return {
    published: true,
    AND: [
      { OR: [{ startDate: null }, { startDate: { lte: now } }] },
      { OR: [{ endDate: null }, { endDate: { gte: now } }] },
    ],
    OR: [
      { showOnAllProducts: true },
      { targetProducts: { some: { productId: product.id } } },
      // A product with no category cannot match a category binding, and an
      // empty `some` clause would quietly match every row instead of none.
      ...(product.categoryId !== null
        ? [{ targetCategories: { some: { categoryId: product.categoryId } } }]
        : []),
      ...(product.subCategoryId !== null
        ? [{ targetSubCategories: { some: { subCategoryId: product.subCategoryId } } }]
        : []),
    ],
  };
}

export async function getPromotionsForProduct(
  product: PromotionTargetProduct,
  now = new Date()
): Promise<ProductPromotion[]> {
  return prisma.promotion.findMany({
    where: productPromotionWhere(product, now),
    orderBy: { createdAt: "desc" },
    select: PRODUCT_PROMOTION_SELECT,
    take: MAX_PROMOTIONS_PER_PRODUCT,
  });
}
