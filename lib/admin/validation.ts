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
  selectedAttributeIds: number[];
  allowedAttributeIds: number[];
}): string[] {
  const errors: string[] = [];
  if (input.subCategory && input.subCategory.categoryId !== input.categoryId) {
    errors.push("หมวดหมู่ย่อยไม่อยู่ในหมวดหมู่ที่เลือก");
  }
  const allowed = new Set(input.allowedAttributeIds);
  if (input.selectedAttributeIds.some((id) => !allowed.has(id))) {
    errors.push("มีคุณลักษณะที่ไม่ได้กำหนดให้กับหมวดหมู่นี้");
  }
  return errors;
}
