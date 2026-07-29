import { describe, expect, it } from "vitest";
import {
  buildProductSearchText,
  compareByRelevance,
  normalizeSearchText,
  scoreProduct,
  searchTextWhere,
  strongMatchWhere,
  tokenizeQuery,
  type ProductForIndex,
} from "@/lib/search";

describe("normalizeSearchText", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalizeSearchText("  Tempered   GLASS ")).toBe("tempered glass");
  });

  it("flattens separators so a hyphenated sku can be typed with spaces", () => {
    expect(normalizeSearchText("GL-TP-6")).toBe("gl tp 6");
  });

  it("leaves Thai text intact", () => {
    expect(normalizeSearchText("กระจกเทมเปอร์ 6 มม.")).toBe("กระจกเทมเปอร์ 6 มม");
  });
});

describe("tokenizeQuery", () => {
  it("returns no tokens for blank input", () => {
    expect(tokenizeQuery("")).toEqual([]);
    expect(tokenizeQuery("   ")).toEqual([]);
    expect(tokenizeQuery("---")).toEqual([]);
  });

  it("keeps a Thai query as a single token", () => {
    expect(tokenizeQuery("กระจก")).toEqual(["กระจก"]);
  });

  it("splits a Latin query on spaces and separators", () => {
    expect(tokenizeQuery("GL-TP 6")).toEqual(["gl", "tp", "6"]);
  });

  it("caps the token count and the query length", () => {
    expect(tokenizeQuery("a b c d e f g h")).toHaveLength(6);
    expect(tokenizeQuery("x".repeat(200))[0]).toHaveLength(64);
  });
});

describe("buildProductSearchText", () => {
  const product: ProductForIndex = {
    nameTh: "กระจกเทมเปอร์ใส",
    nameEn: "Clear Tempered Glass",
    sku: "GL-TP-6",
    slug: "clear-tempered-glass",
    brand: { name: "Guardian" },
    category: { nameTh: "กระจก", nameEn: "Glass" },
    subCategory: { nameTh: "กระจกนิรภัย", nameEn: "Safety Glass" },
    unit: { nameTh: "แผ่น", nameEn: "Sheet" },
    pricingUnit: { nameTh: "ราคาต่อแผ่น", nameEn: "Per sheet" },
    variants: [{ sku: "GL-TP-6-CLR" }, { sku: null }],
    attributeLinks: [
      {
        attributeValue: {
          valueTh: "6 มม.",
          valueEn: "6 mm",
          attribute: { nameTh: "ความหนา", nameEn: "Thickness", unit: "mm" },
        },
      },
    ],
  };

  const text = buildProductSearchText(product);

  it("includes names, sku and slug", () => {
    expect(text).toContain("กระจกเทมเปอร์ใส");
    expect(text).toContain("clear tempered glass");
    expect(text).toContain("gl tp 6");
  });

  it("includes a separator-free sku so GLTP6 also matches", () => {
    expect(text).toContain("gltp6");
  });

  it("includes brand, category, sub-category and units", () => {
    expect(text).toContain("guardian");
    expect(text).toContain("safety glass");
    expect(text).toContain("กระจกนิรภัย");
    expect(text).toContain("แผ่น");
  });

  it("includes attribute values and their attribute names", () => {
    expect(text).toContain("6 มม");
    expect(text).toContain("ความหนา");
    expect(text).toContain("thickness");
  });

  it("includes variant skus and skips null ones", () => {
    expect(text).toContain("gl tp 6 clr");
    expect(text).not.toContain("null");
  });

  it("survives a product with no relations loaded", () => {
    expect(
      buildProductSearchText({ nameTh: "ท", nameEn: "T", sku: "A-1", slug: "t" })
    ).toBe("ท t a 1 a1 t");
  });
});

describe("searchTextWhere", () => {
  it("is undefined for an empty query so callers can spread it away", () => {
    expect(searchTextWhere("")).toBeUndefined();
    expect(searchTextWhere("  ")).toBeUndefined();
  });

  it("requires every token to be present", () => {
    expect(searchTextWhere("clear 6")).toEqual({
      AND: [{ searchText: { contains: "clear" } }, { searchText: { contains: "6" } }],
    });
  });

  it("never sets an insensitive mode, which MySQL does not support", () => {
    expect(JSON.stringify(searchTextWhere("glass"))).not.toContain("mode");
  });
});

describe("strongMatchWhere", () => {
  it("is undefined for an empty query", () => {
    expect(strongMatchWhere("")).toBeUndefined();
  });

  it("restricts each token to the product's own name or sku", () => {
    expect(strongMatchWhere("glass")).toEqual({
      AND: [
        {
          OR: [
            { nameTh: { contains: "glass" } },
            { nameEn: { contains: "glass" } },
            { sku: { contains: "glass" } },
          ],
        },
      ],
    });
  });
});

describe("scoreProduct", () => {
  const glass = { nameTh: "กระจกเทมเปอร์", nameEn: "Tempered Glass", sku: "GL-TP-6" };

  it("ranks an exact sku hit above everything else", () => {
    expect(scoreProduct(glass, "GL-TP-6")).toBeGreaterThan(scoreProduct(glass, "Tempered"));
    expect(scoreProduct(glass, "gltp6")).toBeGreaterThan(scoreProduct(glass, "Tempered"));
  });

  it("ranks a name prefix above a name substring", () => {
    expect(scoreProduct(glass, "Tempered")).toBeGreaterThan(scoreProduct(glass, "Glass"));
  });

  it("still gives a floor score to a product matched only by brand or category", () => {
    expect(scoreProduct(glass, "guardian")).toBe(10);
  });

  it("does not double-count a word present in both languages", () => {
    const bilingual = { nameTh: "tempered", nameEn: "tempered", sku: "X-1" };
    expect(scoreProduct(bilingual, "tempered")).toBe(scoreProduct(glass, "tempered glass"));
  });

  it("scores nothing for an empty query", () => {
    expect(scoreProduct(glass, "")).toBe(0);
  });
});

describe("compareByRelevance", () => {
  it("orders by score, then featured, then sortOrder", () => {
    const items = [
      { nameTh: "c", nameEn: "c", sku: "c", score: 10, featured: false, sortOrder: 1 },
      { nameTh: "a", nameEn: "a", sku: "a", score: 40, featured: false, sortOrder: 9 },
      { nameTh: "b", nameEn: "b", sku: "b", score: 10, featured: true, sortOrder: 5 },
    ];
    expect(items.sort(compareByRelevance).map((item) => item.sku)).toEqual(["a", "b", "c"]);
  });
});
