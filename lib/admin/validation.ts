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
  const seenSkus = new Map<string, string>();
  const duplicateSkus = new Set<string>();
  const combinations = new Set<string>();
  let defaultCount = 0;

  for (const variant of variants) {
    const rawSku = variant.sku?.trim();
    if (rawSku) {
      const skuLower = rawSku.toLowerCase();
      if (seenSkus.has(skuLower)) {
        duplicateSkus.add(seenSkus.get(skuLower)!);
        duplicateSkus.add(rawSku);
      } else {
        seenSkus.set(skuLower, rawSku);
      }
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

  if (duplicateSkus.size > 0) {
    errors.add(`พบ SKU ซ้ำกันในตัวเลือก: ${[...duplicateSkus].join(", ")}`);
  }

  if (published) {
    if (defaultCount > 1) errors.add("กำหนดตัวเลือกเริ่มต้นได้เพียงหนึ่งรายการ");
    if (variants.length > 0 && defaultCount === 0) errors.add("กรุณากำหนดตัวเลือกเริ่มต้นหนึ่งรายการ");
  }
  return [...errors];
}

export interface ProductCustomFieldInput {
  /** Client token of the option value that reveals this field */
  triggerToken: string;
  inputType: "NUMBER" | "TEXT";
  labelTh: string;
  labelEn: string;
  unitTh: string;
  unitEn: string;
  /** As typed, so a blank stays distinguishable from a real zero */
  minValue: string;
  maxValue: string;
  step: string;
  maxLength: string;
  /** false = the customer may leave it blank, and "ไม่ระบุ" is stored instead */
  required: boolean;
}

/**
 * The longest `QuotationItem.customFieldsTh` can be. Mirrors the column width,
 * which in turn is what keeps one quotation line inside the LINE bubble budget
 * (see `splitIntoBubbles` in lib/line/message.ts).
 */
const CUSTOM_FIELDS_COLUMN_LIMIT = 255;

/** Hard ceiling on one text answer — matches MAX_TEXT_FIELD_LENGTH. */
const TEXT_FIELD_LIMIT = 200;

/**
 * What a customer types into a custom field is the one piece of a cart line the
 * server cannot re-read from the catalog — these limits are what it checks
 * instead (`resolveCustomValues` in lib/quotation-custom-fields.ts).
 *
 * So an inverted range or a missing length cap is not a cosmetic flaw: it
 * decides what reaches the sales team, and how long the LINE card gets. Checked
 * for drafts too, unlike most product rules.
 */
export function validateProductCustomFields(fields: ProductCustomFieldInput[]): string[] {
  const errors = new Set<string>();

  for (const field of fields) {
    const name = field.labelTh.trim() || "ช่องกรอกที่ยังไม่ได้ตั้งชื่อ";

    if (field.inputType === "TEXT") {
      const maxLength = Number(field.maxLength);
      if (!field.maxLength.trim() || !Number.isFinite(maxLength)) {
        errors.add(`"${name}": กรุณากรอกความยาวสูงสุดเป็นตัวเลข`);
        continue;
      }
      if (!Number.isInteger(maxLength) || maxLength < 1) {
        errors.add(`"${name}": ความยาวสูงสุดต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป`);
      }
      if (maxLength > TEXT_FIELD_LIMIT) {
        errors.add(`"${name}": ความยาวสูงสุดต้องไม่เกิน ${TEXT_FIELD_LIMIT} ตัวอักษร`);
      }
      continue;
    }

    // หน่วยบังคับเฉพาะช่องตัวเลข — "1200" ลอย ๆ ไม่บอกว่าเป็นมิลลิเมตรหรือเซนติเมตร
    if (!field.unitTh.trim() || !field.unitEn.trim()) {
      errors.add(`"${name}": ช่องตัวเลขต้องระบุหน่วยทั้งภาษาไทยและภาษาอังกฤษ`);
    }

    const min = Number(field.minValue);
    const max = Number(field.maxValue);
    const step = Number(field.step);

    if (
      !field.minValue.trim() ||
      !field.maxValue.trim() ||
      !field.step.trim() ||
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      !Number.isFinite(step)
    ) {
      errors.add(`"${name}": ค่าต่ำสุด ค่าสูงสุด และช่วงการกรอกต้องเป็นตัวเลข`);
      continue;
    }
    if (min < 0) errors.add(`"${name}": ค่าต่ำสุดต้องไม่ติดลบ`);
    // Equal bounds leave exactly one legal value, which is a fixed option, not
    // something worth asking the customer to type.
    if (min >= max) errors.add(`"${name}": ค่าสูงสุดต้องมากกว่าค่าต่ำสุด`);
    if (step <= 0) errors.add(`"${name}": ช่วงการกรอกต้องมากกว่า 0`);
    // A step wider than the range would leave only the minimum as a legal entry,
    // so every other number the customer types is silently rejected on submit.
    if (step > 0 && max > min && step > max - min) {
      errors.add(`"${name}": ช่วงการกรอกกว้างเกินกว่าระยะระหว่างค่าต่ำสุดกับค่าสูงสุด`);
    }
  }

  // Two fields on the same trigger with the same label read as duplicates in the
  // cart and on the LINE card, where only the label distinguishes them.
  const seen = new Set<string>();
  for (const field of fields) {
    const key = `${field.triggerToken}|${field.labelTh.trim()}`;
    if (seen.has(key)) errors.add("ชื่อช่องกรอกของค่าเดียวกันต้องไม่ซ้ำกัน");
    seen.add(key);
  }

  // Fields sharing a trigger are formatted into one string. If their worst case
  // overflows the column, `formatCustomFields` would slice it and the sales team
  // would silently lose the tail — so it is rejected here, where it is fixable.
  for (const [token, group] of groupByTrigger(fields)) {
    if (!token) continue;
    for (const locale of ["th", "en"] as const) {
      if (worstCaseLength(group, locale) > CUSTOM_FIELDS_COLUMN_LIMIT) {
        errors.add(
          `ช่องกรอกของค่าเดียวกันยาวรวมกันเกิน ${CUSTOM_FIELDS_COLUMN_LIMIT} ตัวอักษร กรุณาลดความยาวสูงสุดหรือย่อชื่อช่องลง`,
        );
        break;
      }
    }
  }

  return [...errors];
}

function groupByTrigger(
  fields: ProductCustomFieldInput[],
): Map<string, ProductCustomFieldInput[]> {
  const groups = new Map<string, ProductCustomFieldInput[]>();
  for (const field of fields) {
    const group = groups.get(field.triggerToken) ?? [];
    group.push(field);
    groups.set(field.triggerToken, group);
  }
  return groups;
}

/**
 * Longest string `formatCustomFields` could produce for one trigger value.
 * Mirrors the placeholder there: a skipped optional field still costs
 * "label: ไม่ระบุ", which for a short text cap is the longer of the two cases.
 */
const NOT_SPECIFIED_LENGTH = { th: "ไม่ระบุ".length, en: "Not specified".length } as const;

function worstCaseLength(fields: ProductCustomFieldInput[], locale: "th" | "en"): number {
  const SEPARATOR = 3; // " · "
  return fields.reduce((total, field, index) => {
    const label = (locale === "en" ? field.labelEn : field.labelTh).trim();
    const unit = (locale === "en" ? field.unitEn : field.unitTh).trim();
    const value =
      field.inputType === "TEXT"
        ? Math.min(Number(field.maxLength) || TEXT_FIELD_LIMIT, TEXT_FIELD_LIMIT)
        : String(field.maxValue).trim().length;
    // label + ": " + value + (" " + unit); the placeholder carries no unit
    const filled = value + (unit ? unit.length + 1 : 0);
    const widest = field.required ? filled : Math.max(filled, NOT_SPECIFIED_LENGTH[locale]);
    return total + label.length + 2 + widest + (index > 0 ? SEPARATOR : 0);
  }, 0);
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
