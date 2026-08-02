import { describe, expect, it } from "vitest";
import {
  slugifyAdminTitle,
  draftSku,
  isDraftSku,
  isStaleVersion,
  validateBilingualPublish,
  validateProductVariants,
  validateProductClassification,
  validateVariantAxisCoverage,
} from "@/lib/admin/validation";

describe("admin validation", () => {
  it("creates a stable URL slug from English titles", () => {
    expect(slugifyAdminTitle("  Tempered Glass & Aluminum  ")).toBe("tempered-glass-aluminum");
  });

  it("allows incomplete drafts but blocks incomplete publishing", () => {
    const fields = { titleTh: "หัวข้อ", titleEn: "", contentTh: "เนื้อหา", contentEn: "" };

    expect(validateBilingualPublish(fields, false)).toEqual({});
    expect(validateBilingualPublish(fields, true)).toEqual({
      titleEn: ["กรุณากรอกชื่อภาษาอังกฤษก่อนเผยแพร่"],
      contentEn: ["กรุณากรอกเนื้อหาภาษาอังกฤษก่อนเผยแพร่"],
    });
  });

  it("rejects duplicate SKUs, combinations, negative prices, and multiple defaults", () => {
    const result = validateProductVariants([
      { sku: "SKU-1", price: 100, isDefault: true, attributeValueIds: [2, 1] },
      { sku: "sku-1", price: -1, isDefault: true, attributeValueIds: [1, 2] },
    ]);

    expect(result).toEqual(expect.arrayContaining([
      "SKU ของแต่ละตัวเลือกต้องไม่ซ้ำกัน",
      "ชุดคุณลักษณะของแต่ละตัวเลือกต้องไม่ซ้ำกัน",
      "ราคาต้องไม่ติดลบ",
      "กำหนดตัวเลือกเริ่มต้นได้เพียงหนึ่งรายการ",
    ]));
  });

  it("ignores combinations when the caller passes no value ids", () => {
    // The product action addresses values by token and dedupes them itself.
    const result = validateProductVariants([
      { sku: "SKU-1", price: 100, isDefault: true, attributeValueIds: [] },
      { sku: "SKU-2", price: 100, isDefault: false, attributeValueIds: [] },
    ]);

    expect(result).toEqual([]);
  });

  it("lets a draft keep incomplete variants but still guards the unique index", () => {
    const result = validateProductVariants([
      { sku: "SKU-1", price: 100, isDefault: false, attributeValueIds: [2, 1] },
      { sku: "sku-1", price: -1, isDefault: false, attributeValueIds: [1, 2] },
    ], false);

    // No default and a duplicate combination are fine until the product is published.
    expect(result).toEqual(expect.arrayContaining(["SKU ของแต่ละตัวเลือกต้องไม่ซ้ำกัน", "ราคาต้องไม่ติดลบ"]));
    expect(result).not.toContain("กรุณากำหนดตัวเลือกเริ่มต้นหนึ่งรายการ");
    expect(result).not.toContain("ชุดคุณลักษณะของแต่ละตัวเลือกต้องไม่ซ้ำกัน");
  });

  it("recognises the placeholder SKU a draft product is given", () => {
    expect(isDraftSku(draftSku())).toBe(true);
    expect(isDraftSku("GL-001")).toBe(false);
    expect(isDraftSku("")).toBe(false);
    expect(isDraftSku(null)).toBe(false);
    // A random tail keeps two saves in the same millisecond off each other's
    // Product.sku, which is a unique index.
    expect(draftSku()).toMatch(/^DRAFT-[a-z0-9]+-[a-z0-9]{4}$/);
  });

  it("detects optimistic concurrency conflicts from updatedAt", () => {
    const stored = new Date("2026-07-19T08:00:01.000Z");
    expect(isStaleVersion("2026-07-19T08:00:01.000Z", stored)).toBe(false);
    expect(isStaleVersion("2026-07-19T08:00:00.000Z", stored)).toBe(true);
    expect(isStaleVersion("invalid", stored)).toBe(true);
  });

  it("rejects a subcategory that does not belong to the selected category", () => {
    expect(validateProductClassification({ categoryId: 1, subCategory: { id: 9, categoryId: 2 } })).toEqual([
      "หมวดหมู่ย่อยไม่อยู่ในหมวดหมู่ที่เลือก",
    ]);
  });

  it("accepts any attribute a product declares, regardless of its category", () => {
    expect(validateProductClassification({ categoryId: 1, subCategory: { id: 9, categoryId: 1 } })).toEqual([]);
    expect(validateProductClassification({ categoryId: null, subCategory: null })).toEqual([]);
  });

  it("requires every variant to carry exactly one value per variant axis", () => {
    const axes = [
      { attributeId: 1, nameTh: "ความหนา", valueIds: [10, 11] },
      { attributeId: 2, nameTh: "สี", valueIds: [20, 21] },
    ];

    expect(validateVariantAxisCoverage([{ attributeValueIds: [10, 20] }, { attributeValueIds: [11, 21] }], axes)).toEqual([]);

    expect(validateVariantAxisCoverage([{ attributeValueIds: [10] }], axes)).toEqual(['ทุกตัวเลือกต้องระบุ "สี"']);

    expect(validateVariantAxisCoverage([{ attributeValueIds: [20, 21, 10] }], axes)).toEqual([
      'แต่ละตัวเลือกระบุ "สี" ได้เพียงค่าเดียว',
    ]);

    expect(validateVariantAxisCoverage([{ attributeValueIds: [10, 20, 99] }], axes)).toEqual([
      "ตัวเลือกมีค่าคุณลักษณะที่ไม่ได้อยู่ในรายการของสินค้านี้",
    ]);
  });
});
