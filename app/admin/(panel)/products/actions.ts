"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import {
  isStaleVersion,
  slugifyAdminTitle,
  validateBilingualPublish,
  validateProductClassification,
  validateProductVariants,
  validateVariantAxisCoverage,
  type ActionResult,
} from "@/lib/admin/validation";

const imageSchema = z.array(z.object({ url: z.string().trim().min(1), altTh: z.string().optional().default(""), altEn: z.string().optional().default(""), sortOrder: z.number().int().default(0) }));

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
    // literal first: z.coerce.number() would turn "" into 0 and swallow the blank
    price: z.union([z.literal(""), z.coerce.number().min(0)]),
    image: z.string().optional().default(""),
    isAvailable: z.boolean().default(true),
    isDefault: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
    valueTokens: z.array(z.string().regex(/^[vn]:.+$/)),
  }),
);

const optionalId = z.preprocess((value) => (value === "none" || value === "" ? undefined : value), z.coerce.number().int().positive().optional());

const formSchema = z.object({
  id: z.coerce.number().int().positive().optional().or(z.literal("")),
  updatedAt: z.string().optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().trim().min(1),
  nameTh: z.string().trim(),
  nameEn: z.string().trim(),
  descriptionTh: z.string().optional().default(""),
  descriptionEn: z.string().optional().default(""),
  usageGuideTh: z.string().optional().default(""),
  usageGuideEn: z.string().optional().default(""),
  coverImage: z.string().optional().default(""),
  catalogPdf: z.string().optional().default(""),
  basePrice: z.union([z.coerce.number().min(0), z.literal("")]).optional().default(""),
  currency: z.string().trim().default("THB"),
  categoryId: optionalId,
  subCategoryId: optionalId,
  brandId: optionalId,
  unitId: optionalId,
  pricingUnitId: optionalId,
  featured: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  intent: z.enum(["draft", "publish"]),
  imagesJson: z.string(),
  attributesJson: z.string(),
  variantsJson: z.string(),
});

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

export async function saveProductAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = formSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "กรุณาตรวจสอบข้อมูล", fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const published = d.intent === "publish";
  const languageErrors = validateBilingualPublish({ nameTh: d.nameTh, nameEn: d.nameEn }, published);
  if (Object.keys(languageErrors).length) return { success: false, message: "กรุณากรอกชื่อสองภาษาให้ครบก่อนเผยแพร่", fieldErrors: languageErrors };

  let images: z.infer<typeof imageSchema>;
  let attributes: z.infer<typeof attributeSchema>;
  let variants: z.infer<typeof variantSchema>;
  try {
    images = imageSchema.parse(JSON.parse(d.imagesJson));
    attributes = attributeSchema.parse(JSON.parse(d.attributesJson));
    variants = variantSchema.parse(JSON.parse(d.variantsJson));
  } catch {
    return { success: false, message: "ข้อมูลรูปภาพ คุณลักษณะ หรือตัวเลือกไม่ถูกต้อง" };
  }

  // Anything created here lands in the shared dictionary and is rendered on both
  // the Thai and English storefront, so neither language may be left blank —
  // otherwise /en silently shows Thai text with nothing flagging the gap.
  for (const attribute of attributes) {
    if (attribute.attributeId === null && (!attribute.newNameTh || !attribute.newNameEn)) {
      return { success: false, message: "กรุณากรอกชื่อรายการใหม่ให้ครบทั้งภาษาไทยและภาษาอังกฤษ" };
    }
    if (!attribute.valueIds.length && !attribute.newValues.length) {
      return { success: false, message: `กรุณาเพิ่มค่าให้ "${attribute.newNameTh || "รายการที่เลือกไว้"}" อย่างน้อยหนึ่งค่า` };
    }
    if (attribute.newValues.some((value) => !value.valueTh || !value.valueEn)) {
      return { success: false, message: "กรุณากรอกค่าใหม่ให้ครบทั้งภาษาไทยและภาษาอังกฤษ" };
    }
  }

  const prisma = getPrisma();
  const id = typeof d.id === "number" ? d.id : undefined;
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

  // A blank price is a half-finished row, not a free product — say so instead of
  // quietly storing 0.
  if (variants.some((variant) => variant.price === "")) {
    return { success: false, message: "กรุณากรอกราคาให้ครบทุกรายการในตารางราคา" };
  }
  const pricedVariants = variants.map((variant) => ({ ...variant, price: Number(variant.price) }));

  const variantErrors = validateProductVariants(
    pricedVariants.map((variant) => ({ sku: variant.sku, price: variant.price, isDefault: variant.isDefault, attributeValueIds: [] })),
  ).filter((error) => error !== "ชุดคุณลักษณะของแต่ละตัวเลือกต้องไม่ซ้ำกัน");
  const duplicateCombination = new Set(variants.map((variant) => [...variant.valueTokens].sort().join("|"))).size !== variants.length;
  if (duplicateCombination) variantErrors.push("ชุดคุณลักษณะของแต่ละตัวเลือกต้องไม่ซ้ำกัน");
  if (variantErrors.length) return { success: false, message: variantErrors.join(" · ") };

  const core = {
    slug: d.slug,
    sku: d.sku,
    nameTh: d.nameTh,
    nameEn: d.nameEn,
    descriptionTh: d.descriptionTh || null,
    descriptionEn: d.descriptionEn || null,
    usageGuideTh: d.usageGuideTh || null,
    usageGuideEn: d.usageGuideEn || null,
    coverImage: d.coverImage || null,
    catalogPdf: d.catalogPdf || null,
    basePrice: d.basePrice === "" ? null : d.basePrice,
    currency: d.currency,
    featured: d.featured === "on",
    published,
    sortOrder: d.sortOrder,
    categoryId,
    subCategoryId,
    brandId: typeof d.brandId === "number" ? d.brandId : null,
    unitId: typeof d.unitId === "number" ? d.unitId : null,
    pricingUnitId: typeof d.pricingUnitId === "number" ? d.pricingUnitId : null,
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

      const axisErrors = validateVariantAxisCoverage(
        variants.map((variant) => ({ attributeValueIds: variant.valueTokens.map((token) => tokenToValueId.get(token)!) })),
        resolved
          .filter((attribute) => attribute.isVariantAxis)
          .map((attribute) => ({ attributeId: attribute.attributeId, nameTh: attribute.nameTh, valueIds: attribute.valueIds })),
      );
      if (axisErrors.length) throw new Error(`AXIS:${axisErrors.join(" · ")}`);

      await tx.productImage.deleteMany({ where: { productId: row.id } });
      await tx.productAttribute.deleteMany({ where: { productId: row.id } });
      await tx.productAttributeValue.deleteMany({ where: { productId: row.id } });
      await tx.productVariant.deleteMany({ where: { productId: row.id } });

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

      for (const [index, variant] of pricedVariants.entries()) {
        await tx.productVariant.create({
          data: {
            productId: row.id,
            sku: variant.sku || null,
            price: variant.price,
            image: variant.image || null,
            isAvailable: variant.isAvailable,
            isDefault: variant.isDefault,
            sortOrder: variant.sortOrder || index,
            attributeValues: { create: [...new Set(variant.valueTokens.map((token) => tokenToValueId.get(token)!))].map((attributeValueId) => ({ attributeValueId })) },
          },
        });
      }

      return row;
    });

    await recordActivity({
      adminId: admin.id,
      action: id ? (published ? "PUBLISH" : "UPDATE") : "CREATE",
      entityType: "products",
      entityId: product.id,
      label: product.nameTh,
      metadata: { published, variants: variants.length, images: images.length, attributes: attributes.length },
    });
    ["/admin/products", "/products", "/en/products", `/products/${product.slug}`, `/en/products/${product.slug}`].forEach((path) => revalidatePath(path));
    return { success: true, message: "บันทึกสินค้าสำเร็จ" };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AXIS:")) return { success: false, message: error.message.slice(5) };
    if (error instanceof Error && error.message === "VARIANT_TOKEN_UNRESOLVED") {
      return { success: false, message: "ตัวเลือกอ้างถึงค่าคุณลักษณะที่ถูกลบไปแล้ว กรุณากดสร้างตัวเลือกใหม่" };
    }
    return { success: false, message: error instanceof Error && error.message.includes("Unique constraint") ? "Slug หรือ SKU ถูกใช้งานแล้ว" : "บันทึกสินค้าไม่สำเร็จ" };
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
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const confirmation = String(formData.get("confirmation") || "");
  const prisma = getPrisma();
  const product = await prisma.product.findUniqueOrThrow({ where: { id } });
  const normConf = confirmation.trim().toUpperCase();
  const isMatch = normConf === "DELETE" || (product.nameTh && normConf === product.nameTh.trim().toUpperCase());
  if (product.published || !isMatch) throw new Error("Unpublish and confirm product deletion before proceeding");
  await prisma.product.delete({ where: { id } });
  await recordActivity({ adminId: admin.id, action: "DELETE", entityType: "products", entityId: id, label: product.nameTh });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/en/products");
}
