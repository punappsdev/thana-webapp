export type FieldErrors = Record<string, string[]>;

export function slugifyAdminTitle(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateBilingualPublish(
  fields: Record<string, string | null | undefined>,
  published: boolean,
): FieldErrors {
  if (!published) return {};

  const labels: Record<string, string> = {
    titleTh: "ชื่อภาษาไทย",
    titleEn: "ชื่อภาษาอังกฤษ",
    contentTh: "เนื้อหาภาษาไทย",
    contentEn: "เนื้อหาภาษาอังกฤษ",
    nameTh: "ชื่อภาษาไทย",
    nameEn: "ชื่อภาษาอังกฤษ",
  };

  return Object.entries(fields).reduce<FieldErrors>((errors, [key, value]) => {
    if (!value?.trim() && labels[key]) {
      errors[key] = [`กรุณากรอก${labels[key]}ก่อนเผยแพร่`];
    }
    return errors;
  }, {});
}

/**
 * Prefix of the placeholder SKU a draft product gets while the admin has not
 * typed a real one yet. `Product.sku` is `@unique` and NOT NULL, so a blank
 * draft cannot simply store "" — every row needs its own token.
 */
export const DRAFT_SKU_PREFIX = "DRAFT-";

/** The random tail matters: two tabs saving in the same millisecond would
 *  otherwise collide on the unique index and surface as a duplicate-SKU error.
 *  Padded because Math.random() can produce a short base-36 fraction. */
export function draftSku(): string {
  const tail = Math.random().toString(36).slice(2).padEnd(4, "0").slice(0, 4);
  return `${DRAFT_SKU_PREFIX}${Date.now().toString(36)}-${tail}`;
}

export function isDraftSku(sku: string | null | undefined): boolean {
  return !!sku?.startsWith(DRAFT_SKU_PREFIX);
}

export interface ProductVariantInput {
  sku?: string | null;
  price: number;
  isDefault: boolean;
  attributeValueIds: number[];
}

/**
 * How many variant rows one product may have — the product of every option axis.
 * Lives here rather than next to the editor so the save action can enforce it
 * too: the editor's cap is a courtesy, this is the one that actually holds.
 */
export const MAX_COMBINATIONS = 200;

/**
 * A draft is work in progress, so only the rules the database itself enforces
 * apply to it: duplicate variant SKUs (`ProductVariant.sku` is `@unique`, and
 * letting one through would surface as an unrelated P2002 message) and negative
 * prices. Everything else exists so the public variant picker behaves, and is
 * therefore checked only when publishing.
 */
export function validateProductVariants(variants: ProductVariantInput[], published = true): string[] {
  const errors = new Set<string>();
  const skus = new Set<string>();
  const combinations = new Set<string>();
  let defaultCount = 0;

  for (const variant of variants) {
    const sku = variant.sku?.trim().toLowerCase();
    if (sku) {
      if (skus.has(sku)) errors.add("SKU ของแต่ละตัวเลือกต้องไม่ซ้ำกัน");
      skus.add(sku);
    }

    // A caller that addresses values by token rather than id passes no value ids
    // and compares combinations itself, so an empty list is not a combination to
    // dedupe — treating it as one would flag every multi-variant product.
    if (variant.attributeValueIds.length) {
      const combination = [...variant.attributeValueIds].sort((a, b) => a - b).join(":");
      if (published && combinations.has(combination)) {
        errors.add("ชุดคุณลักษณะของแต่ละตัวเลือกต้องไม่ซ้ำกัน");
      }
      combinations.add(combination);
    }

    if (variant.price < 0) errors.add("ราคาต้องไม่ติดลบ");
    if (variant.isDefault) defaultCount += 1;
  }

  if (published) {
    if (defaultCount > 1) errors.add("กำหนดตัวเลือกเริ่มต้นได้เพียงหนึ่งรายการ");
    if (variants.length > 0 && defaultCount === 0) errors.add("กรุณากำหนดตัวเลือกเริ่มต้นหนึ่งรายการ");
  }
  return [...errors];
}

export interface VariantAxis {
  attributeId: number;
  nameTh: string;
  valueIds: number[];
}

/**
 * The public variant selector matches a customer's choice against a variant by
 * exact set equality on value ids (components/products/variant-selector.tsx).
 * A variant missing an axis — or carrying two values from the same axis — can
 * therefore never be selected, so reject those combinations at save time.
 */
export function validateVariantAxisCoverage(
  variants: { attributeValueIds: number[] }[],
  axes: VariantAxis[],
): string[] {
  if (!variants.length || !axes.length) return [];

  const errors = new Set<string>();
  const axisOfValue = new Map<number, VariantAxis>();
  for (const axis of axes) {
    for (const valueId of axis.valueIds) axisOfValue.set(valueId, axis);
  }

  for (const variant of variants) {
    const seen = new Map<number, number>();
    for (const valueId of variant.attributeValueIds) {
      const axis = axisOfValue.get(valueId);
      if (!axis) {
        errors.add("ตัวเลือกมีค่าคุณลักษณะที่ไม่ได้อยู่ในรายการของสินค้านี้");
        continue;
      }
      seen.set(axis.attributeId, (seen.get(axis.attributeId) ?? 0) + 1);
    }
    for (const axis of axes) {
      const count = seen.get(axis.attributeId) ?? 0;
      if (count === 0) errors.add(`ทุกตัวเลือกต้องระบุ "${axis.nameTh}"`);
      if (count > 1) errors.add(`แต่ละตัวเลือกระบุ "${axis.nameTh}" ได้เพียงค่าเดียว`);
    }
  }

  return [...errors];
}

export type ActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: FieldErrors;
  conflict?: boolean;
};

export function isStaleVersion(submittedUpdatedAt: string, storedUpdatedAt: Date): boolean {
  const submitted = new Date(submittedUpdatedAt);
  return Number.isNaN(submitted.getTime()) || submitted.getTime() !== storedUpdatedAt.getTime();
}

export function validateProductClassification(input: {
  categoryId: number | null;
  subCategory: { id: number; categoryId: number } | null;
}): string[] {
  const errors: string[] = [];
  if (input.subCategory && input.subCategory.categoryId !== input.categoryId) {
    errors.push("หมวดหมู่ย่อยไม่อยู่ในหมวดหมู่ที่เลือก");
  }
  return errors;
}
