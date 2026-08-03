import { describe, expect, it } from "vitest";
import { productPromotionWhere } from "@/lib/promotions";

const NOW = new Date("2026-08-03T12:00:00.000Z");

const FULLY_CLASSIFIED = { id: 42, categoryId: 7, subCategoryId: 13 };
const UNCLASSIFIED = { id: 42, categoryId: null, subCategoryId: null };

/** The OR branches, keyed by which binding rule each one represents. */
function branches(product: Parameters<typeof productPromotionWhere>[0]) {
  const or = productPromotionWhere(product, NOW).OR;
  return Array.isArray(or) ? or : [];
}

describe("productPromotionWhere", () => {
  it("only shows published promotions", () => {
    expect(productPromotionWhere(FULLY_CLASSIFIED, NOW).published).toBe(true);
  });

  it("requires the schedule to be open at both ends", () => {
    // Unlike the /news archive, an offer shown next to a quote button has to be
    // claimable — a promotion that has not started or has ended must not match.
    expect(productPromotionWhere(FULLY_CLASSIFIED, NOW).AND).toEqual([
      { OR: [{ startDate: null }, { startDate: { lte: NOW } }] },
      { OR: [{ endDate: null }, { endDate: { gte: NOW } }] },
    ]);
  });

  it("matches all four binding rules for a fully classified product", () => {
    expect(branches(FULLY_CLASSIFIED)).toEqual([
      { showOnAllProducts: true },
      { targetProducts: { some: { productId: 42 } } },
      { targetCategories: { some: { categoryId: 7 } } },
      { targetSubCategories: { some: { subCategoryId: 13 } } },
    ]);
  });

  it("drops the category branches when the product has no category", () => {
    // A `some: { categoryId: null }` clause would match every promotion that has
    // any category binding at all, not none of them.
    expect(branches(UNCLASSIFIED)).toEqual([
      { showOnAllProducts: true },
      { targetProducts: { some: { productId: 42 } } },
    ]);
  });

  it("keeps the store-wide rule for every product", () => {
    for (const product of [FULLY_CLASSIFIED, UNCLASSIFIED]) {
      expect(branches(product)).toContainEqual({ showOnAllProducts: true });
    }
  });

  it("keeps a sub-category binding usable when the main category is unset", () => {
    expect(branches({ id: 1, categoryId: null, subCategoryId: 13 })).toEqual([
      { showOnAllProducts: true },
      { targetProducts: { some: { productId: 1 } } },
      { targetSubCategories: { some: { subCategoryId: 13 } } },
    ]);
  });
});
