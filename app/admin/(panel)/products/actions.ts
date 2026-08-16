"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import type { Prisma } from "@/generated/prisma/client";
import { deleteOrphanedMedia } from "@/lib/admin/media";
import { fallbackToken } from "@/lib/admin/slug";
import { getPrisma } from "@/lib/prisma";
import { reindexProducts, reindexProductsWhere } from "@/lib/search-index";
import { MAX_CUSTOM_FIELDS } from "@/lib/quotation-custom-fields";
import { sanitizeRichHtml } from "@/lib/admin/security";
import {
  MAX_COMBINATIONS,
  draftSku,
  isDraftSku,
  isStaleVersion,
  slugifyAdminTitle,
  validateBilingualPublish,
  validateProductClassification,
  validateProductCustomFields,
  validateProductVariants,
  validateVariantAxisCoverage,
  type ActionResult,
} from "@/lib/admin/validation";

const imageSchema = z.array(z.object({ url: z.string().trim().min(1), altTh: z.string().optional().default(""), altEn: z.string().optional().default(""), sortOrder: z.number().int().default(0) })).max(4, "ใส่รูปเพิ่มเติมได้สูงสุด 4 รูป");

/**
 * An attribute card is either an existing dictionary entry (`attributeId`) or a
 * new one the admin typed into the combobox (`newNameTh`). Its values work the
 * same way — `valueIds` for existing rows, `newValues` for typed ones.
 */
const attributeSchema = z.array(
  z.object({
    attributeId: z.number().int().positive().nullable(),
    newNameTh: z.string().trim().optional().default(""),
    newNameEn: z.string().trim().optional().default(""),
    isVariantAxis: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
    valueIds: z.array(z.number().int().positive()).default([]),
    newValues: z.array(z.object({ key: z.string().min(1), valueTh: z.string().trim().min(1), valueEn: z.string().trim().optional().default("") })).default([]),
  }),
);

/** Variants address attribute values by token ("v:<id>" or "n:<clientKey>"). */
const variantSchema = z.array(
  z.object({
    sku: z.string().optional().default(""),
    // No longer editable in the form, but still submitted so a save preserves the
    // stored value. Literal first: z.coerce.number() would turn "" into 0.
    price: z.union([z.literal(""), z.coerce.number().min(0)]).optional().default(""),
    image: z.string().optional().default(""),
    isAvailable: z.boolean().default(true),
    isDefault: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
    valueTokens: z.array(z.string().regex(/^[vn]:.+$/)),
  }),
).max(MAX_COMBINATIONS, `ตัวเลือกสินค้าได้สูงสุด ${MAX_COMBINATIONS} รายการ กรุณาลดจำนวนค่าของตัวเลือกลง`);

/**
 * A field the customer types a number into. Addressed by the same value token as
 * variants so it can point at a value the admin typed a moment ago.
 *
 * The bounds arrive as strings so a blank stays blank: `z.coerce.number()` turns
 * "" into 0, which would silently publish a field accepting a zero measurement.
 */
const customFieldSchema = z.array(
  z.object({
    triggerToken: z.string().regex(/^[vn]:.+$/, "กรุณาเลือกค่าที่จะเปิดช่องกรอกให้ครบทุกช่อง"),
    inputType: z.enum(["NUMBER", "TEXT"]).default("NUMBER"),
    labelTh: z.string().trim().min(1, "กรุณากรอกชื่อช่องกรอกภาษาไทย").max(60),
    labelEn: z.string().trim().min(1, "กรุณากรอกชื่อช่องกรอกภาษาอังกฤษ").max(60),
    // Free text usually has no unit, so emptiness is checked per input type in
    // validateProductCustomFields rather than here.
    unitTh: z.string().trim().max(20).default(""),
    unitEn: z.string().trim().max(20).default(""),
    minValue: z.string().trim().default(""),
    maxValue: z.string().trim().default(""),
    step: z.string().trim().default(""),
    maxLength: z.string().trim().default(""),
    required: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  }),
).max(MAX_CUSTOM_FIELDS, `ช่องให้ลูกค้ากรอกเองได้สูงสุด ${MAX_CUSTOM_FIELDS} ช่องต่อสินค้าหนึ่งตัว`);

const optionalId = z.preprocess((value) => (value === "none" || value === "" ? undefined : value), z.coerce.number().int().positive().optional());

const formSchema = z.object({
  id: z.coerce.number().int().positive().optional().or(z.literal("")),
  updatedAt: z.string().optional(),
  // Hidden from non-technical admins and generated from the English name; a typed
  // value (from the advanced section) is still honoured, just sanitized/deduped.
  slug: z.string().trim().optional().default(""),
  // Optional so a half-finished product can still be saved as a draft; a real
  // value is required to publish (and a placeholder is generated meanwhile).
  sku: z.string().trim().optional().default(""),
  nameTh: z.string().trim(),
  nameEn: z.string().trim(),
  descriptionTh: z.string().optional().default(""),
  descriptionEn: z.string().optional().default(""),
  usageGuideTh: z.string().optional().default(""),
  usageGuideEn: z.string().optional().default(""),
  coverImage: z.string().optional().default(""),
  catalogPdf: z.string().optional().default(""),
  categoryId: optionalId,
  subCategoryId: optionalId,
  brandId: optionalId,
  unitId: optionalId,
  sortOrder: z.coerce.number().int().default(0),
  intent: z.enum(["draft", "publish"]),
  imagesJson: z.string(),
  attributesJson: z.string(),
  variantsJson: z.string(),
  // Optional so a product form saved before this feature existed still parses.
  customFieldsJson: z.string().optional().default("[]"),
});

const renameDictionaryEntrySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("attribute"),
    id: z.number().int().positive(),
    nameTh: z.string().trim().min(1).max(191),
    nameEn: z.string().trim().min(1).max(191),
  }),
  z.object({
    kind: z.literal("value"),
    id: z.number().int().positive(),
    nameTh: z.string().trim().min(1).max(191),
    nameEn: z.string().trim().min(1).max(191),
  }),
]);

type AttributeInput = z.infer<typeof attributeSchema>[number];

/**
 * Builds a slug that does not collide with anything already in `taken`.
 * Thai names slugify to an empty string, which is the common case here, so
 * `fallback` names the entity rather than leaving an anonymous "item".
 * These slugs are internal keys — admins can rename them under /admin/catalog.
 */
function uniqueSlug(base: string, taken: Set<string>, fallback: string): string {
  const seed = slugifyAdminTitle(base) || fallback;
  let candidate = seed;
  let suffix = 2;
  while (taken.has(candidate)) candidate = `${seed}-${suffix++}`;
  taken.add(candidate);
  return candidate;
}

/** Store rich product copy as safe HTML while retaining null for empty fields. */
function sanitizeProductRichText(value: string): string | null {
  if (!value.trim()) return null;
  const sanitized = sanitizeRichHtml(value);
  return sanitized.trim() ? sanitized : null;
}

/**
 * The product slug is hidden from admins now, so make it collision-proof before
 * the write: an occupied slug just gets a "-2", "-3"… suffix. Deduping here means
 * any unique-constraint error that still surfaces is the (visible) SKU, not slug.
 */
async function ensureUniqueProductSlug(prisma: ReturnType<typeof getPrisma>, base: string, excludeId?: number): Promise<string> {
  let candidate = base;
  for (let suffix = 2; await prisma.product.findFirst({ where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } }); suffix++) {
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function renameDictionaryEntryAction(input: { kind: "attribute" | "value"; id: number; nameTh: string; nameEn: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = renameDictionaryEntrySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "กรุณาตรวจสอบชื่อและข้อมูลที่กรอก" };

  const d = parsed.data;
  const prisma = getPrisma();
  const resource = d.kind === "attribute" ? "attributes" : "attribute-values";
  const productWhere: Prisma.ProductWhereInput = d.kind === "attribute"
    ? { attributes: { some: { attributeId: d.id } } }
    : { attributeLinks: { some: { attributeValueId: d.id } } };

  try {
    const existing = d.kind === "attribute"
      ? await prisma.attribute.findUnique({ where: { id: d.id }, select: { id: true } })
      : await prisma.attributeValue.findUnique({ where: { id: d.id }, select: { id: true } });
    if (!existing) return { success: false, message: "ไม่พบข้อมูลที่ต้องการเปลี่ยนชื่อ" };

    if (d.kind === "attribute") {
      await prisma.attribute.update({ where: { id: d.id }, data: { nameTh: d.nameTh, nameEn: d.nameEn } });
    } else {
      await prisma.attributeValue.update({ where: { id: d.id }, data: { valueTh: d.nameTh, valueEn: d.nameEn } });
    }

    await reindexProductsWhere(productWhere);
    await recordActivity({ adminId: admin.id, action: "UPDATE", entityType: resource, entityId: d.id, label: d.nameTh });

    revalidatePath(`/admin/catalog/${resource}`);
    revalidatePath("/products");
    revalidatePath("/en/products");
    revalidatePath("/products/[slug]", "page");
    revalidatePath("/en/products/[slug]", "page");

    return { success: true, message: "เปลี่ยนชื่อสำเร็จ" };
  } catch (error) {
    console.error("renameDictionaryEntryAction failed", { kind: d.kind, id: d.id }, error);
    return { success: false, message: "เปลี่ยนชื่อไม่สำเร็จ" };
  }
}

export async function saveProductAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = formSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "กรุณาตรวจสอบข้อมูล", fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const published = d.intent === "publish";
  const languageErrors = validateBilingualPublish({ nameTh: d.nameTh, nameEn: d.nameEn }, published);
  if (Object.keys(languageErrors).length) return { success: false, message: "กรุณากรอกชื่อสองภาษาให้ครบก่อนเผยแพร่", fieldErrors: languageErrors };
  // A draft keeps its generated placeholder SKU (which the form hides), so an
  // empty field here always means the admin has not chosen a real one yet.
  if (published && !d.sku) {
    const message = "กรุณากรอกรหัสสินค้า (SKU) ก่อนเผยแพร่";
    return { success: false, message, fieldErrors: { sku: [message] } };
  }

  let images: z.infer<typeof imageSchema>;
  let attributes: z.infer<typeof attributeSchema>;
  let variants: z.infer<typeof variantSchema>;
  let customFields: z.infer<typeof customFieldSchema>;
  try {
    images = imageSchema.parse(JSON.parse(d.imagesJson));
    attributes = attributeSchema.parse(JSON.parse(d.attributesJson));
    variants = variantSchema.parse(JSON.parse(d.variantsJson));
    customFields = customFieldSchema.parse(JSON.parse(d.customFieldsJson));
  } catch (error) {
    // A schema rejection here carries a message worth showing ("สูงสุด 4 รูป",
    // the variant cap); only a malformed JSON blob needs the generic fallback.
    const issue = error instanceof z.ZodError ? error.issues[0]?.message : null;
    return { success: false, message: issue || "ข้อมูลรูปภาพ คุณลักษณะ หรือตัวเลือกไม่ถูกต้อง" };
  }

  // The bounds are what the quotation action enforces against a payload the
  // customer can edit, so a nonsensical range here is not a cosmetic problem —
  // it decides what the sales team is asked to quote. Checked for drafts too:
  // publishing is one click away and a broken range is never worth storing.
  const customFieldErrors = validateProductCustomFields(customFields);
  if (customFieldErrors.length) return { success: false, message: customFieldErrors.join(" · ") };

  // Anything created here lands in the shared dictionary and is rendered on both
  // the Thai and English storefront, so neither language may be left blank —
  // otherwise /en silently shows Thai text with nothing flagging the gap. These
  // two rules hold for drafts as well: the rows outlive this product and would
  // turn up half-filled in every other product's editor.
  for (const attribute of attributes) {
    if (attribute.attributeId === null && (!attribute.newNameTh || !attribute.newNameEn)) {
      return { success: false, message: "กรุณากรอกชื่อรายการใหม่ให้ครบทั้งภาษาไทยและภาษาอังกฤษ" };
    }
    if (attribute.newValues.some((value) => !value.valueTh || !value.valueEn)) {
      return { success: false, message: "กรุณากรอกค่าใหม่ให้ครบทั้งภาษาไทยและภาษาอังกฤษ" };
    }
    // An empty attribute only matters once customers see it, so a draft may
    // carry one the admin has not filled in yet.
    if (published && !attribute.valueIds.length && !attribute.newValues.length) {
      return { success: false, message: `กรุณาเพิ่มค่าให้ "${attribute.newNameTh || "รายการที่เลือกไว้"}" อย่างน้อยหนึ่งค่า` };
    }
  }

  const prisma = getPrisma();
  const id = typeof d.id === "number" ? d.id : undefined;
  // Snapshot the current media URLs before the write so files dropped on this
  // edit can be cleaned up afterwards (only if nothing else still uses them).
  // `sku` rides along so re-saving a draft can reuse the placeholder it was given
  // the first time instead of minting a new one on every save.
  const oldMedia = id ? await prisma.product.findUnique({ where: { id }, select: { sku: true, coverImage: true, catalogPdf: true, images: { select: { url: true } }, variants: { select: { image: true } } } }) : null;
  const categoryId = typeof d.categoryId === "number" ? d.categoryId : null;
  const subCategoryId = typeof d.subCategoryId === "number" ? d.subCategoryId : null;

  if (id && d.updatedAt) {
    const existing = await prisma.product.findUnique({ where: { id }, select: { updatedAt: true } });
    if (!existing) return { success: false, message: "ไม่พบสินค้า" };
    if (isStaleVersion(d.updatedAt, existing.updatedAt)) return { success: false, conflict: true, message: "ข้อมูลถูกแก้ไขจากอีกหน้าต่าง กรุณาโหลดหน้าใหม่" };
  }

  const subCategory = subCategoryId ? await prisma.subCategory.findUnique({ where: { id: subCategoryId }, select: { id: true, categoryId: true } }) : null;
  const classificationErrors = validateProductClassification({ categoryId, subCategory });
  if (classificationErrors.length) return { success: false, message: classificationErrors.join(" · ") };

  // Every referenced existing value must really exist and belong to the
  // attribute the card claims, otherwise the spec table would show mismatches.
  const referencedValueIds = [...new Set(attributes.flatMap((attribute) => attribute.valueIds))];
  const knownValues = await prisma.attributeValue.findMany({ where: { id: { in: referencedValueIds } }, select: { id: true, attributeId: true } });
  if (knownValues.length !== referencedValueIds.length) return { success: false, message: "พบค่าคุณลักษณะที่ไม่มีอยู่ในระบบ" };
  const attributeOfValue = new Map(knownValues.map((value) => [value.id, value.attributeId]));
  for (const attribute of attributes) {
    if (attribute.attributeId === null) continue;
    if (attribute.valueIds.some((valueId) => attributeOfValue.get(valueId) !== attribute.attributeId)) {
      return { success: false, message: "พบค่าคุณลักษณะที่ไม่ตรงกับคุณลักษณะที่เลือก" };
    }
  }

  // Price is no longer collected anywhere. Rows the form carried over keep their
  // stored value; a brand new combination simply starts at 0.
  const pricedVariants = variants.map((variant) => ({
    ...variant,
    price: variant.price === "" ? 0 : Number(variant.price),
  }));

  // Combinations are compared here rather than inside the helper because the rows
  // address values by token, not by id — hence the empty `attributeValueIds`.
  const variantErrors = validateProductVariants(
    pricedVariants.map((variant) => ({ sku: variant.sku, price: variant.price, isDefault: variant.isDefault, attributeValueIds: [] })),
    published,
  );
  if (published) {
    const duplicateCombination = new Set(variants.map((variant) => [...variant.valueTokens].sort().join("|"))).size !== variants.length;
    if (duplicateCombination) variantErrors.push("ชุดคุณลักษณะของแต่ละตัวเลือกต้องไม่ซ้ำกัน");
  }

  // Check if main SKU collides with any variant SKU in the form
  const mainSkuTrimmed = d.sku?.trim();
  if (mainSkuTrimmed && !isDraftSku(mainSkuTrimmed)) {
    const matchingVariant = pricedVariants.find((v) => v.sku?.trim().toLowerCase() === mainSkuTrimmed.toLowerCase());
    if (matchingVariant) {
      variantErrors.push(`รหัสสินค้าหลัก (SKU "${mainSkuTrimmed}") ซ้ำกับในรายการตัวเลือก`);
    }
  }

  if (variantErrors.length) return { success: false, message: variantErrors.join(" · ") };

  // Check for duplicate SKUs in DB before proceeding
  const candidateSkus = [...new Set([
    ...(mainSkuTrimmed && !isDraftSku(mainSkuTrimmed) ? [mainSkuTrimmed] : []),
    ...pricedVariants.map((v) => v.sku?.trim()).filter((sku): sku is string => Boolean(sku && !isDraftSku(sku))),
  ])];

  if (candidateSkus.length > 0) {
    const [dbProductMatches, dbVariantMatches] = await Promise.all([
      prisma.product.findMany({
        where: {
          sku: { in: candidateSkus },
          ...(id ? { NOT: { id } } : {}),
        },
        select: { sku: true },
      }),
      prisma.productVariant.findMany({
        where: {
          sku: { in: candidateSkus },
          ...(id ? { NOT: { productId: id } } : {}),
        },
        select: { sku: true },
      }),
    ]);

    const existingSkusInDb = [...new Set([
      ...dbProductMatches.map((p) => p.sku),
      ...dbVariantMatches.map((v) => v.sku).filter((sku): sku is string => Boolean(sku)),
    ])];

    if (existingSkusInDb.length > 0) {
      const message = `รหัสสินค้า (SKU) "${existingSkusInDb.join(", ")}" ถูกใช้แล้วในระบบ กรุณาเปลี่ยนใหม่`;
      return {
        success: false,
        message,
        fieldErrors: mainSkuTrimmed && existingSkusInDb.includes(mainSkuTrimmed) ? { sku: [`รหัสสินค้า (SKU) "${mainSkuTrimmed}" ถูกใช้แล้ว`] } : undefined,
      };
    }
  }

  const slug = await ensureUniqueProductSlug(prisma, slugifyAdminTitle(d.slug || d.nameEn) || fallbackToken("product"), id);
  const core = {
    slug,
    // Reuse an existing placeholder so a draft's SKU stays put across saves; a
    // brand new draft gets a fresh one because the column is unique and NOT NULL.
    sku: d.sku || (isDraftSku(oldMedia?.sku) ? oldMedia!.sku : draftSku()),
    nameTh: d.nameTh,
    nameEn: d.nameEn,
    descriptionTh: sanitizeProductRichText(d.descriptionTh),
    descriptionEn: sanitizeProductRichText(d.descriptionEn),
    usageGuideTh: sanitizeProductRichText(d.usageGuideTh),
    usageGuideEn: sanitizeProductRichText(d.usageGuideEn),
    coverImage: d.coverImage || null,
    catalogPdf: d.catalogPdf || null,
    // `basePrice`, `currency` and `pricingUnitId` are deliberately absent: the site
    // quotes on request, so nothing edits them and a save must leave them as-is.
    // `featured` / `featuredOrder` are curated on /admin/featured — deliberately
    // not written here so editing a product never resets its featured status.
    published,
    sortOrder: d.sortOrder,
    categoryId,
    subCategoryId,
    brandId: typeof d.brandId === "number" ? d.brandId : null,
    unitId: typeof d.unitId === "number" ? d.unitId : null,
  };

  try {
    const product = await prisma.$transaction(async (tx) => {
      const row = id ? await tx.product.update({ where: { id }, data: core }) : await tx.product.create({ data: core });

      // Resolve every card to a real attribute id, creating dictionary entries
      // for the ones typed inline, and map value tokens to real value ids.
      const tokenToValueId = new Map<string, number>();
      const resolved: { attributeId: number; nameTh: string; isVariantAxis: boolean; sortOrder: number; valueIds: number[] }[] = [];

      // Names of the dictionary attributes already picked, so validation errors
      // can say which attribute is at fault rather than a generic label.
      const pickedIds = attributes.map((attribute) => attribute.attributeId).filter((value): value is number => value !== null);
      const pickedNames = new Map(
        (await tx.attribute.findMany({ where: { id: { in: pickedIds } }, select: { id: true, nameTh: true } })).map((item) => [item.id, item.nameTh]),
      );

      for (const attribute of attributes) {
        const attributeId = attribute.attributeId ?? (await createAttribute(tx, attribute));
        const nameTh = attribute.attributeId === null ? attribute.newNameTh : pickedNames.get(attribute.attributeId) ?? "คุณลักษณะ";
        const valueIds = [...attribute.valueIds];
        for (const valueId of attribute.valueIds) tokenToValueId.set(`v:${valueId}`, valueId);

        if (attribute.newValues.length) {
          const siblings = await tx.attributeValue.findMany({ where: { attributeId }, select: { slug: true, sortOrder: true } });
          const taken = new Set(siblings.map((value) => value.slug));
          // Append after existing values; leaving every new value at 0 would make
          // the editor's row order shuffle between visits.
          let nextSortOrder = siblings.reduce((max, value) => Math.max(max, value.sortOrder), 0) + 1;
          for (const value of attribute.newValues) {
            const created = await tx.attributeValue.create({
              data: {
                attributeId,
                slug: uniqueSlug(value.valueEn, taken, "value"),
                valueTh: value.valueTh,
                valueEn: value.valueEn,
                sortOrder: nextSortOrder++,
              },
            });
            valueIds.push(created.id);
            tokenToValueId.set(`n:${value.key}`, created.id);
          }
        }

        resolved.push({ attributeId, nameTh, isVariantAxis: attribute.isVariantAxis, sortOrder: attribute.sortOrder, valueIds });
      }

      const unresolved = variants.flatMap((variant) => variant.valueTokens).filter((token) => !tokenToValueId.has(token));
      if (unresolved.length) throw new Error("VARIANT_TOKEN_UNRESOLVED");

      // A custom field pointing at a value that no longer exists would never be
      // shown, so the admin would think it was saved and the customer would
      // never see the size box.
      if (customFields.some((field) => !tokenToValueId.has(field.triggerToken))) {
        throw new Error("CUSTOM_FIELD_TOKEN_UNRESOLVED");
      }

      // Only the public variant selector cares that every axis is covered, so a
      // draft may hold half-built combinations until it is ready to publish.
      if (published) {
        const axisErrors = validateVariantAxisCoverage(
          variants.map((variant) => ({ attributeValueIds: variant.valueTokens.map((token) => tokenToValueId.get(token)!) })),
          resolved
            .filter((attribute) => attribute.isVariantAxis)
            .map((attribute) => ({ attributeId: attribute.attributeId, nameTh: attribute.nameTh, valueIds: attribute.valueIds })),
        );
        if (axisErrors.length) throw new Error(`AXIS:${axisErrors.join(" · ")}`);
      }

      await tx.productImage.deleteMany({ where: { productId: row.id } });
      await tx.productAttribute.deleteMany({ where: { productId: row.id } });
      await tx.productAttributeValue.deleteMany({ where: { productId: row.id } });
      await tx.productVariant.deleteMany({ where: { productId: row.id } });
      await tx.productCustomField.deleteMany({ where: { productId: row.id } });

      // Written as one statement for the same reason as the variants below:
      // every statement inside this transaction costs ~45ms.
      if (customFields.length) {
        await tx.productCustomField.createMany({
          // The columns for the other input type are nulled rather than left at
          // some leftover number: `resolveCustomValues` treats a missing bound on
          // a NUMBER field as a broken row, so a stale value must not survive a
          // switch from ตัวเลข to ข้อความ and back.
          data: customFields.map((field, index) => {
            const isText = field.inputType === "TEXT";
            return {
              productId: row.id,
              triggerValueId: tokenToValueId.get(field.triggerToken)!,
              inputType: field.inputType,
              labelTh: field.labelTh,
              labelEn: field.labelEn,
              unitTh: field.unitTh || null,
              unitEn: field.unitEn || null,
              minValue: isText ? null : Number(field.minValue),
              maxValue: isText ? null : Number(field.maxValue),
              step: isText ? null : Number(field.step),
              maxLength: isText ? Number(field.maxLength) : null,
              required: field.required,
              sortOrder: field.sortOrder || index,
            };
          }),
        });
      }

      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((image, index) => ({ productId: row.id, url: image.url, altTh: image.altTh || null, altEn: image.altEn || null, sortOrder: image.sortOrder || index })),
        });
      }

      if (resolved.length) {
        await tx.productAttribute.createMany({
          data: resolved.map((attribute) => ({ productId: row.id, attributeId: attribute.attributeId, isVariantAxis: attribute.isVariantAxis, sortOrder: attribute.sortOrder })),
        });
        // The spec table on the public page reads ProductAttributeValue, so mirror
        // every value the cards declare — no separate ticking step for the admin.
        const specValueIds = [...new Set(resolved.flatMap((attribute) => attribute.valueIds))];
        if (specValueIds.length) {
          await tx.productAttributeValue.createMany({ data: specValueIds.map((attributeValueId) => ({ productId: row.id, attributeValueId })) });
        }
      }

      // Written in bulk rather than row by row. Every statement inside an
      // interactive transaction costs ~45ms here, and a per-variant create (plus
      // its nested value rows) is 3 of them — 60 variants blew past Prisma's 5s
      // transaction timeout and surfaced as a bare "บันทึกสินค้าไม่สำเร็จ".
      // Three statements total now, regardless of how many variants there are.
      if (pricedVariants.length) {
        await tx.productVariant.createMany({
          data: pricedVariants.map((variant, index) => ({
            productId: row.id,
            sku: variant.sku || null,
            price: variant.price,
            image: variant.image || null,
            isAvailable: variant.isAvailable,
            isDefault: variant.isDefault,
            sortOrder: variant.sortOrder || index,
          })),
        });

        // createMany cannot return ids on MySQL and the join rows need them.
        // Every variant of this product was deleted just above, so these are all
        // ours, and a multi-row INSERT assigns auto-increment ids in row order —
        // reading back by ascending id lines them up with `pricedVariants`.
        const created = await tx.productVariant.findMany({ where: { productId: row.id }, select: { id: true }, orderBy: { id: "asc" } });
        if (created.length !== pricedVariants.length) throw new Error("VARIANT_ID_MISMATCH");

        await tx.variantAttributeValue.createMany({
          data: pricedVariants.flatMap((variant, index) =>
            [...new Set(variant.valueTokens.map((token) => tokenToValueId.get(token)!))].map((attributeValueId) => ({
              variantId: created[index].id,
              attributeValueId,
            })),
          ),
        });
      }

      return row;
    });

    // The search text is derived from rows the transaction just rewrote —
    // attributes and variants included — so it can only be rebuilt after commit.
    await reindexProducts([product.id]);

    await recordActivity({
      adminId: admin.id,
      action: id ? (published ? "PUBLISH" : "UPDATE") : "CREATE",
      entityType: "products",
      entityId: product.id,
      label: product.nameTh,
      metadata: { published, variants: variants.length, images: images.length, attributes: attributes.length },
    });
    ["/admin/products", "/products", "/en/products", `/products/${product.slug}`, `/en/products/${product.slug}`].forEach((path) => revalidatePath(path));
    if (oldMedia) {
      const kept = new Set<string>([d.coverImage, d.catalogPdf, ...images.map((image) => image.url), ...pricedVariants.map((variant) => variant.image)].filter(Boolean) as string[]);
      const removed = [oldMedia.coverImage, oldMedia.catalogPdf, ...oldMedia.images.map((image) => image.url), ...oldMedia.variants.map((variant) => variant.image)].filter((url): url is string => !!url && !kept.has(url));
      await deleteOrphanedMedia(removed);
    }
    return { success: true, message: "บันทึกสินค้าสำเร็จ" };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AXIS:")) return { success: false, message: error.message.slice(5) };
    if (error instanceof Error && error.message === "VARIANT_TOKEN_UNRESOLVED") {
      return { success: false, message: "ตัวเลือกอ้างถึงค่าคุณลักษณะที่ถูกลบไปแล้ว กรุณากดสร้างตัวเลือกใหม่" };
    }
    if (error instanceof Error && error.message === "CUSTOM_FIELD_TOKEN_UNRESOLVED") {
      return { success: false, message: "ช่องให้ลูกค้ากรอกเองผูกอยู่กับค่าที่ถูกลบไปแล้ว กรุณาเลือกค่าใหม่ให้ช่องนั้น" };
    }
    // The fallback message says nothing about what went wrong, so anything
    // reaching it has to be legible in the server log or it is undiagnosable.
    if (!(error instanceof Error && error.message.includes("Unique constraint"))) {
      console.error("saveProductAction failed", { productId: id, variants: variants.length, attributes: attributes.length }, error);
    }
    return { success: false, message: error instanceof Error && error.message.includes("Unique constraint") ? "รหัสสินค้า (SKU) นี้ถูกใช้แล้ว กรุณาเปลี่ยนใหม่" : "บันทึกสินค้าไม่สำเร็จ" };
  }
}

async function createAttribute(tx: Prisma.TransactionClient, attribute: AttributeInput): Promise<number> {
  const existingSlugs = await tx.attribute.findMany({ select: { slug: true } });
  const created = await tx.attribute.create({
    data: {
      slug: uniqueSlug(attribute.newNameEn, new Set(existingSlugs.map((item) => item.slug)), "attribute"),
      nameTh: attribute.newNameTh,
      nameEn: attribute.newNameEn,
    },
  });
  return created.id;
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  // Auth + the unpublished guard are the real safety net; a typed "DELETE"
  // confirmation only added friction, so the dialog now just asks yes/no.
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const prisma = getPrisma();
  const product = await prisma.product.findUniqueOrThrow({ where: { id }, include: { images: { select: { url: true } }, variants: { select: { image: true } } } });
  if (product.published) throw new Error("Unpublish product before permanent deletion");
  await prisma.product.delete({ where: { id } });
  await recordActivity({ adminId: admin.id, action: "DELETE", entityType: "products", entityId: id, label: product.nameTh });
  // Clean up files this product owned, keeping any still reused elsewhere.
  await deleteOrphanedMedia([product.coverImage, product.catalogPdf, ...product.images.map((image) => image.url), ...product.variants.map((variant) => variant.image)]);
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/en/products");
}
