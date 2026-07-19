import { describe, expect, it } from "vitest";
import {
  slugifyAdminTitle,
  isStaleVersion,
  validateBilingualPublish,
  validateProductVariants,
  validateProductClassification,
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

  it("detects optimistic concurrency conflicts from updatedAt", () => {
    const stored = new Date("2026-07-19T08:00:01.000Z");
    expect(isStaleVersion("2026-07-19T08:00:01.000Z", stored)).toBe(false);
    expect(isStaleVersion("2026-07-19T08:00:00.000Z", stored)).toBe(true);
    expect(isStaleVersion("invalid", stored)).toBe(true);
  });

  it("rejects a subcategory or attribute that does not belong to the selected category", () => {
    expect(validateProductClassification({ categoryId: 1, subCategory: { id: 9, categoryId: 2 }, selectedAttributeIds: [3, 4], allowedAttributeIds: [3] })).toEqual([
      "หมวดหมู่ย่อยไม่อยู่ในหมวดหมู่ที่เลือก",
      "มีคุณลักษณะที่ไม่ได้กำหนดให้กับหมวดหมู่นี้",
    ]);
  });
});
