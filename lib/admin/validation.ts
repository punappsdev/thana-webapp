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

export interface ProductVariantInput {
  sku?: string | null;
  price: number;
  isDefault: boolean;
  attributeValueIds: number[];
}

export function validateProductVariants(variants: ProductVariantInput[]): string[] {
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

    const combination = [...variant.attributeValueIds].sort((a, b) => a - b).join(":");
    if (combinations.has(combination)) {
      errors.add("ชุดคุณลักษณะของแต่ละตัวเลือกต้องไม่ซ้ำกัน");
    }
    combinations.add(combination);

    if (variant.price < 0) errors.add("ราคาต้องไม่ติดลบ");
    if (variant.isDefault) defaultCount += 1;
  }

  if (defaultCount > 1) errors.add("กำหนดตัวเลือกเริ่มต้นได้เพียงหนึ่งรายการ");
  if (variants.length > 0 && defaultCount === 0) errors.add("กรุณากำหนดตัวเลือกเริ่มต้นหนึ่งรายการ");
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
