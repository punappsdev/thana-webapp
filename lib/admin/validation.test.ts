import { describe, expect, it } from "vitest";
import {
  slugifyAdminTitle,
  draftSku,
  isDraftSku,
  isStaleVersion,
  validateBilingualPublish,
  validateProductVariants,
  validateProductClassification,
  validateProductCustomFields,
  type ProductCustomFieldInput,
  validateVariantAxisCoverage,
  validateHref,
  safeCssUrl,
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
      "พบ SKU ซ้ำกันในตัวเลือก: SKU-1, sku-1",
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

    // No duplicate combination is fine until the product is published.
    expect(result).toEqual(expect.arrayContaining(["พบ SKU ซ้ำกันในตัวเลือก: SKU-1, sku-1", "ราคาต้องไม่ติดลบ"]));
    expect(result).not.toContain("ชุดคุณลักษณะของแต่ละตัวเลือกต้องไม่ซ้ำกัน");
  });

  it("allows publishing products with zero default variants", () => {
    const result = validateProductVariants([
      { sku: "SKU-1", price: 100, isDefault: false, attributeValueIds: [1] },
      { sku: "SKU-2", price: 100, isDefault: false, attributeValueIds: [2] },
    ], true);

    expect(result).toEqual([]);
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

  describe("custom fields customers type into", () => {
    const field = (overrides: Partial<ProductCustomFieldInput> = {}): ProductCustomFieldInput => ({
      triggerToken: "v:7",
      inputType: "NUMBER",
      labelTh: "กว้าง",
      labelEn: "Width",
      unitTh: "มม.",
      unitEn: "mm",
      minValue: "100",
      maxValue: "2400",
      step: "1",
      maxLength: "",
      required: true,
      ...overrides,
    });

    const textField = (overrides: Partial<ProductCustomFieldInput> = {}): ProductCustomFieldInput =>
      field({
        inputType: "TEXT",
        labelTh: "ข้อความสลัก",
        labelEn: "Engraving",
        unitTh: "",
        unitEn: "",
        minValue: "",
        maxValue: "",
        step: "",
        maxLength: "60",
        ...overrides,
      });

    it("accepts a realistic cut-to-size range", () => {
      expect(validateProductCustomFields([field()])).toEqual([]);
    });

    it("rejects a range with nothing in it", () => {
      expect(validateProductCustomFields([field({ minValue: "2400", maxValue: "100" })])).toHaveLength(1);
      expect(validateProductCustomFields([field({ minValue: "100", maxValue: "100" })])).toHaveLength(1);
    });

    it("rejects a step that leaves only the minimum enterable", () => {
      expect(validateProductCustomFields([field({ minValue: "100", maxValue: "200", step: "500" })])).toHaveLength(1);
      expect(validateProductCustomFields([field({ step: "0" })])).toHaveLength(1);
    });

    it("rejects bounds that are not numbers", () => {
      expect(validateProductCustomFields([field({ maxValue: "สองเมตร" })])).toHaveLength(1);
    });

    it("rejects two identically labelled fields on the same option value", () => {
      // Only the label tells them apart in the cart and on the LINE card.
      expect(validateProductCustomFields([field(), field()])).toContain(
        "ชื่อช่องกรอกของค่าเดียวกันต้องไม่ซ้ำกัน",
      );
    });

    it("allows the same label under two different option values", () => {
      expect(validateProductCustomFields([field(), field({ triggerToken: "v:9" })])).toEqual([]);
    });

    it("requires a unit on a number field but not on a text one", () => {
      // "1200" alone does not say millimetres or centimetres.
      expect(validateProductCustomFields([field({ unitTh: "", unitEn: "" })])).toHaveLength(1);
      expect(validateProductCustomFields([textField()])).toEqual([]);
    });

    it("requires a usable length cap on a text field", () => {
      expect(validateProductCustomFields([textField({ maxLength: "" })])).toHaveLength(1);
      expect(validateProductCustomFields([textField({ maxLength: "0" })])).toHaveLength(1);
      expect(validateProductCustomFields([textField({ maxLength: "12.5" })])).toHaveLength(1);
      // Above the hard ceiling that protects the LINE bubble budget.
      expect(validateProductCustomFields([textField({ maxLength: "500" })])).toHaveLength(1);
    });

    it("ignores the numeric limits on a text field", () => {
      // Switching a field from ตัวเลข to ข้อความ leaves the old bounds in the
      // form; they must not keep failing validation once they are unused.
      expect(
        validateProductCustomFields([textField({ minValue: "2400", maxValue: "100", step: "0" })]),
      ).toEqual([]);
    });

    it("rejects fields whose combined worst case would overflow the column", () => {
      // formatCustomFields would slice the tail off and the sales team would
      // never know a measurement went missing.
      const errors = validateProductCustomFields([
        textField({ labelTh: "ก".repeat(60), labelEn: "a".repeat(60), maxLength: "200" }),
        textField({ labelTh: "ข".repeat(60), labelEn: "b".repeat(60), maxLength: "200" }),
      ]);

      expect(errors.some((error) => error.includes("255"))).toBe(true);
    });

    it("accepts a realistic mix of measurements and a note", () => {
      expect(
        validateProductCustomFields([
          field(),
          field({ labelTh: "สูง", labelEn: "Height", maxValue: "3600" }),
          textField({ maxLength: "60" }),
        ]),
      ).toEqual([]);
    });
  });

  describe("validateHref", () => {
    it("accepts root-relative paths and page anchors", () => {
      expect(validateHref("/products")).toBe(true);
      expect(validateHref("/api/uploads/file.webp")).toBe(true);
      expect(validateHref("#promo")).toBe(true);
    });

    it("accepts http/https/mailto/tel", () => {
      expect(validateHref("https://example.com/page")).toBe(true);
      expect(validateHref("http://example.com")).toBe(true);
      expect(validateHref("mailto:sales@example.com")).toBe(true);
      expect(validateHref("tel:+6621234567")).toBe(true);
    });

    it("rejects executable schemes and protocol-relative links", () => {
      expect(validateHref("javascript:alert(1)")).toBe(false);
      expect(validateHref("data:text/html,<script>1</script>")).toBe(false);
      expect(validateHref("vbscript:msgbox(1)")).toBe(false);
      expect(validateHref("//evil.example.com")).toBe(false);
    });

    it("treats an empty string as an acceptable optional link", () => {
      expect(validateHref("")).toBe(true);
    });
  });

  describe("safeCssUrl", () => {
    it("keeps a normal media path unchanged", () => {
      expect(safeCssUrl("/api/uploads/abc123.webp")).toBe("/api/uploads/abc123.webp");
      expect(safeCssUrl("https://cdn.example.com/photo.jpg")).toBe("https://cdn.example.com/photo.jpg");
    });

    it("strips characters that could break out of url(...)", () => {
      expect(safeCssUrl('/api/uploads/x.png") ;background:url(javascript:alert(1))')).not.toMatch(/[()"'\\]/);
      expect(safeCssUrl("/api/uploads/x.png")).toBe("/api/uploads/x.png");
    });

    it("refuses javascript:/data: schemes and empty values", () => {
      expect(safeCssUrl("javascript:alert(1)")).toBe("");
      expect(safeCssUrl("data:image/svg+xml,<svg/>")).toBe("");
      expect(safeCssUrl("")).toBe("");
      expect(safeCssUrl(null)).toBe("");
    });
  });
});
