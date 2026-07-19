"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { getPrisma } from "@/lib/prisma";
import { isStaleVersion, validateBilingualPublish, validateProductClassification, validateProductVariants, type ActionResult } from "@/lib/admin/validation";

const imageSchema = z.array(z.object({ url: z.string().trim().min(1), altTh: z.string().optional().default(""), altEn: z.string().optional().default(""), sortOrder: z.number().int().default(0) }));
const variantSchema = z.array(z.object({ sku: z.string().optional().default(""), price: z.coerce.number().min(0), comparePrice: z.union([z.coerce.number().min(0), z.literal("")]).optional().default(""), image: z.string().optional().default(""), isAvailable: z.boolean().default(true), isDefault: z.boolean().default(false), sortOrder: z.number().int().default(0), attributeValueIds: z.array(z.number().int().positive()) }));
const optionalId = z.preprocess((value) => value === "none" || value === "" ? undefined : value, z.coerce.number().int().positive().optional());
const formSchema = z.object({ id: z.coerce.number().int().positive().optional().or(z.literal("")), updatedAt: z.string().optional(), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), sku: z.string().trim().min(1), nameTh: z.string().trim(), nameEn: z.string().trim(), descriptionTh: z.string().optional().default(""), descriptionEn: z.string().optional().default(""), usageGuideTh: z.string().optional().default(""), usageGuideEn: z.string().optional().default(""), coverImage: z.string().optional().default(""), catalogPdf: z.string().optional().default(""), basePrice: z.union([z.coerce.number().min(0), z.literal("")]).optional().default(""), currency: z.string().trim().default("THB"), categoryId: optionalId, subCategoryId: optionalId, brandId: optionalId, unitId: optionalId, pricingUnitId: optionalId, featured: z.string().optional(), sortOrder: z.coerce.number().int().default(0), intent: z.enum(["draft", "publish"]), imagesJson: z.string(), variantsJson: z.string(), attributeValueIdsJson: z.string() });

export async function saveProductAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin(); const parsed = formSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "กรุณาตรวจสอบข้อมูล", fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data; const published = d.intent === "publish"; const languageErrors = validateBilingualPublish({ nameTh: d.nameTh, nameEn: d.nameEn }, published);
  if (Object.keys(languageErrors).length) return { success: false, message: "กรุณากรอกชื่อสองภาษาให้ครบก่อนเผยแพร่", fieldErrors: languageErrors };
  let images: z.infer<typeof imageSchema>; let variants: z.infer<typeof variantSchema>; let attributeValueIds: number[];
  try { images = imageSchema.parse(JSON.parse(d.imagesJson)); variants = variantSchema.parse(JSON.parse(d.variantsJson)); attributeValueIds = z.array(z.number().int().positive()).parse(JSON.parse(d.attributeValueIdsJson)); } catch { return { success: false, message: "ข้อมูลรูปภาพหรือ Variant ไม่ถูกต้อง" }; }
  const variantErrors = validateProductVariants(variants); if (variantErrors.length) return { success: false, message: variantErrors.join(" · ") };
  const prisma = getPrisma(); const id = typeof d.id === "number" ? d.id : undefined; const categoryId = typeof d.categoryId === "number" ? d.categoryId : null; const subCategoryId = typeof d.subCategoryId === "number" ? d.subCategoryId : null;
  if (id && d.updatedAt) { const existing = await prisma.product.findUnique({ where: { id }, select: { updatedAt: true } }); if (!existing) return { success: false, message: "ไม่พบสินค้า" }; if (isStaleVersion(d.updatedAt, existing.updatedAt)) return { success: false, conflict: true, message: "ข้อมูลถูกแก้ไขจากอีกหน้าต่าง กรุณาโหลดหน้าใหม่" }; }
  const [subCategory, selectedValues, categoryMappings] = await Promise.all([subCategoryId ? prisma.subCategory.findUnique({ where: { id: subCategoryId }, select: { id: true, categoryId: true } }) : null, prisma.attributeValue.findMany({ where: { id: { in: [...new Set([...attributeValueIds, ...variants.flatMap((variant) => variant.attributeValueIds)])] } }, select: { id: true, attributeId: true } }), categoryId ? prisma.categoryAttribute.findMany({ where: { categoryId }, select: { attributeId: true } }) : []]);
  const classificationErrors = validateProductClassification({ categoryId, subCategory, selectedAttributeIds: selectedValues.map((value) => value.attributeId), allowedAttributeIds: categoryMappings.map((mapping) => mapping.attributeId) }); if (classificationErrors.length) return { success: false, message: classificationErrors.join(" · ") };
  if (selectedValues.length !== new Set([...attributeValueIds, ...variants.flatMap((variant) => variant.attributeValueIds)]).size) return { success: false, message: "พบค่าคุณลักษณะที่ไม่มีอยู่ในระบบ" };
  const core = { slug: d.slug, sku: d.sku, nameTh: d.nameTh, nameEn: d.nameEn, descriptionTh: d.descriptionTh || null, descriptionEn: d.descriptionEn || null, usageGuideTh: d.usageGuideTh || null, usageGuideEn: d.usageGuideEn || null, coverImage: d.coverImage || null, catalogPdf: d.catalogPdf || null, basePrice: d.basePrice === "" ? null : d.basePrice, currency: d.currency, featured: d.featured === "on", published, sortOrder: d.sortOrder, categoryId, subCategoryId, brandId: typeof d.brandId === "number" ? d.brandId : null, unitId: typeof d.unitId === "number" ? d.unitId : null, pricingUnitId: typeof d.pricingUnitId === "number" ? d.pricingUnitId : null };
  try {
    const product = await prisma.$transaction(async (tx) => {
      const row = id ? await tx.product.update({ where: { id }, data: core }) : await tx.product.create({ data: core });
      await tx.productImage.deleteMany({ where: { productId: row.id } }); await tx.productAttributeValue.deleteMany({ where: { productId: row.id } }); await tx.productVariant.deleteMany({ where: { productId: row.id } });
      if (images.length) await tx.productImage.createMany({ data: images.map((image, index) => ({ productId: row.id, url: image.url, altTh: image.altTh || null, altEn: image.altEn || null, sortOrder: image.sortOrder || index })) });
      if (attributeValueIds.length) await tx.productAttributeValue.createMany({ data: [...new Set(attributeValueIds)].map((attributeValueId) => ({ productId: row.id, attributeValueId })) });
      for (const [index, variant] of variants.entries()) await tx.productVariant.create({ data: { productId: row.id, sku: variant.sku || null, price: variant.price, comparePrice: variant.comparePrice === "" ? null : variant.comparePrice, image: variant.image || null, isAvailable: variant.isAvailable, isDefault: variant.isDefault, sortOrder: variant.sortOrder || index, attributeValues: { create: [...new Set(variant.attributeValueIds)].map((attributeValueId) => ({ attributeValueId })) } } });
      return row;
    });
    await recordActivity({ adminId: admin.id, action: id ? (published ? "PUBLISH" : "UPDATE") : "CREATE", entityType: "products", entityId: product.id, label: product.nameTh, metadata: { published, variants: variants.length, images: images.length } });
    ["/admin/products", "/products", "/en/products", `/products/${product.slug}`, `/en/products/${product.slug}`].forEach((path) => revalidatePath(path));
    return { success: true, message: "บันทึกสินค้าสำเร็จ" };
  } catch (error) { return { success: false, message: error instanceof Error && error.message.includes("Unique constraint") ? "Slug หรือ SKU ถูกใช้งานแล้ว" : "บันทึกสินค้าไม่สำเร็จ" }; }
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin(); const id = Number(formData.get("id")); const confirmation = String(formData.get("confirmation") || ""); const prisma = getPrisma(); const product = await prisma.product.findUniqueOrThrow({ where: { id } });
  if (product.published || confirmation !== product.nameTh) throw new Error("Unpublish and confirm product name before deletion");
  await prisma.product.delete({ where: { id } }); await recordActivity({ adminId: admin.id, action: "DELETE", entityType: "products", entityId: id, label: product.nameTh }); revalidatePath("/admin/products"); revalidatePath("/products"); revalidatePath("/en/products");
}
