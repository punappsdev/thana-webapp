"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { isCatalogResource } from "@/lib/admin/catalog-config";
import { codeFromName, fallbackToken, isUniqueConstraintError } from "@/lib/admin/slug";
import { getPrisma } from "@/lib/prisma";
import { slugifyAdminTitle, type ActionResult } from "@/lib/admin/validation";

const schema = z.object({ resource: z.string(), id: z.coerce.number().int().positive().optional().or(z.literal("")), slug: z.string().trim().optional().default(""), code: z.string().trim().optional().default(""), name: z.string().trim().optional().default(""), nameTh: z.string().trim().optional().default(""), nameEn: z.string().trim().optional().default(""), descriptionTh: z.string().optional().default(""), descriptionEn: z.string().optional().default(""), coverImage: z.string().optional().default(""), logo: z.string().optional().default(""), websiteUrl: z.string().optional().default(""), unit: z.string().optional().default(""), inputType: z.enum(["SELECT", "COLOR", "NUMBER", "TEXT"]).optional().default("SELECT"), valueTh: z.string().optional().default(""), valueEn: z.string().optional().default(""), colorHex: z.string().optional().default(""), numericValue: z.string().optional().default(""), sortOrder: z.coerce.number().int().optional().default(0), categoryId: z.coerce.number().int().positive().optional().or(z.literal("")), attributeId: z.coerce.number().int().positive().optional().or(z.literal("")), published: z.string().optional() });

export async function saveCatalogAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "กรุณาตรวจสอบข้อมูล", fieldErrors: parsed.error.flatten().fieldErrors };
  if (!isCatalogResource(parsed.data.resource)) return { success: false, message: "ประเภทข้อมูลไม่ถูกต้อง" };
  const d = parsed.data; const id = typeof d.id === "number" ? d.id : undefined; const prisma = getPrisma();
  // Slug / code are hidden from non-technical admins and generated from the
  // English name (falling back to a short token for Thai-only input). Only fill
  // when empty so an edit keeps its existing slug and power users can still
  // override via the "advanced" fields.
  const usesCode = d.resource === "units" || d.resource === "pricing-units";
  const slugSource = d.resource === "brands" ? d.name : d.resource === "attribute-values" ? d.valueEn : d.nameEn;
  if (usesCode) { if (!d.code) d.code = codeFromName(d.nameEn) || fallbackToken("U").toUpperCase().replace(/[^A-Z0-9]+/g, ""); }
  else if (!d.slug) { d.slug = slugifyAdminTitle(slugSource) || fallbackToken(d.resource); }
  const baseSlug = d.slug; const baseCode = d.code;
  try {
    const writeOnce = () => (async () => {
      switch (d.resource) {
        case "categories": { const data = { slug: d.slug, nameTh: d.nameTh, nameEn: d.nameEn, descriptionTh: d.descriptionTh || null, descriptionEn: d.descriptionEn || null, coverImage: d.coverImage || null, sortOrder: d.sortOrder, published: d.published === "on" }; return id ? prisma.category.update({ where: { id }, data }) : prisma.category.create({ data }); }
        case "subcategories": { if (typeof d.categoryId !== "number") throw new Error("กรุณาเลือกหมวดหมู่"); const data = { slug: d.slug, nameTh: d.nameTh, nameEn: d.nameEn, coverImage: d.coverImage || null, sortOrder: d.sortOrder, published: d.published === "on", categoryId: d.categoryId }; return id ? prisma.subCategory.update({ where: { id }, data }) : prisma.subCategory.create({ data }); }
        case "brands": { const data = { slug: d.slug, name: d.name, logo: d.logo || null, websiteUrl: d.websiteUrl || null }; return id ? prisma.brand.update({ where: { id }, data }) : prisma.brand.create({ data }); }
        case "units": { const data = { code: d.code, nameTh: d.nameTh, nameEn: d.nameEn }; return id ? prisma.productUnit.update({ where: { id }, data }) : prisma.productUnit.create({ data }); }
        case "pricing-units": { const data = { code: d.code, nameTh: d.nameTh, nameEn: d.nameEn }; return id ? prisma.pricingUnit.update({ where: { id }, data }) : prisma.pricingUnit.create({ data }); }
        case "attributes": { const data = { slug: d.slug, nameTh: d.nameTh, nameEn: d.nameEn, unit: d.unit || null, inputType: d.inputType, sortOrder: d.sortOrder }; return id ? prisma.attribute.update({ where: { id }, data }) : prisma.attribute.create({ data }); }
        case "attribute-values": { if (typeof d.attributeId !== "number") throw new Error("กรุณาเลือกคุณลักษณะ"); const data = { slug: d.slug, valueTh: d.valueTh, valueEn: d.valueEn, colorHex: d.colorHex || null, numericValue: d.numericValue || null, sortOrder: d.sortOrder, attributeId: d.attributeId }; return id ? prisma.attributeValue.update({ where: { id }, data }) : prisma.attributeValue.create({ data }); }
        case "article-categories": { const data = { slug: d.slug, nameTh: d.nameTh, nameEn: d.nameEn }; return id ? prisma.articleCategory.update({ where: { id }, data }) : prisma.articleCategory.create({ data }); }
      }
    })();
    // On create, an auto-generated slug/code may collide with an existing row
    // (e.g. two brands named the same in English). Retry with a numeric suffix
    // so the admin never sees a raw duplicate error for a field they can't see.
    let saved: Awaited<ReturnType<typeof writeOnce>> | undefined;
    for (let attempt = 1; ; attempt++) {
      try { saved = await writeOnce(); break; }
      catch (error) {
        if (!id && isUniqueConstraintError(error) && attempt <= 5) { if (usesCode) d.code = `${baseCode}${attempt + 1}`; else d.slug = `${baseSlug}-${attempt + 1}`; continue; }
        throw error;
      }
    }
    if (!saved) return { success: false, message: "ประเภทข้อมูลไม่ถูกต้อง" };
    await recordActivity({ adminId: admin.id, action: id ? "UPDATE" : "CREATE", entityType: d.resource, entityId: saved.id, label: d.nameTh || d.name || d.valueTh || d.code || d.slug });
    revalidatePath(`/admin/catalog/${d.resource}`); revalidatePath("/products"); revalidatePath("/en/products");
    return { success: true, message: "บันทึกข้อมูลสำเร็จ" };
  } catch (error) { return { success: false, message: error instanceof Error && error.message.startsWith("กรุณา") ? error.message : "บันทึกไม่สำเร็จ อาจมี Slug หรือรหัสซ้ำ" }; }
}

export async function deleteCatalogAction(formData: FormData): Promise<void> {
  // Auth + the reference guard below are the real safety net; a typed "DELETE"
  // confirmation only added friction for non-technical admins, so it's gone.
  const admin = await requireAdmin(); const resource = String(formData.get("resource")); const id = Number(formData.get("id"));
  if (!isCatalogResource(resource) || !Number.isInteger(id)) throw new Error("Invalid delete request");
  const prisma = getPrisma();
  const blocked = await (async () => { switch (resource) { case "categories": { const x = await prisma.category.findUniqueOrThrow({ where: { id }, include: { _count: { select: { products: true, subCategories: true, works: true } } } }); return x._count.products + x._count.subCategories + x._count.works; } case "subcategories": return (await prisma.subCategory.findUniqueOrThrow({ where: { id }, include: { _count: { select: { products: true } } } }))._count.products; case "brands": return (await prisma.brand.findUniqueOrThrow({ where: { id }, include: { _count: { select: { products: true } } } }))._count.products; case "units": return (await prisma.productUnit.findUniqueOrThrow({ where: { id }, include: { _count: { select: { products: true } } } }))._count.products; case "pricing-units": return (await prisma.pricingUnit.findUniqueOrThrow({ where: { id }, include: { _count: { select: { products: true } } } }))._count.products; case "attributes": { const x = await prisma.attribute.findUniqueOrThrow({ where: { id }, include: { _count: { select: { values: true, products: true } } } }); return x._count.values + x._count.products; } case "attribute-values": { const x = await prisma.attributeValue.findUniqueOrThrow({ where: { id }, include: { _count: { select: { products: true, variants: true } } } }); return x._count.products + x._count.variants; } case "article-categories": return (await prisma.articleCategory.findUniqueOrThrow({ where: { id }, include: { _count: { select: { articles: true } } } }))._count.articles; } })();
  if (blocked > 0) throw new Error("ข้อมูลนี้ถูกอ้างอิงอยู่และไม่สามารถลบได้");
  switch (resource) { case "categories": await prisma.category.delete({ where: { id } }); break; case "subcategories": await prisma.subCategory.delete({ where: { id } }); break; case "brands": await prisma.brand.delete({ where: { id } }); break; case "units": await prisma.productUnit.delete({ where: { id } }); break; case "pricing-units": await prisma.pricingUnit.delete({ where: { id } }); break; case "attributes": await prisma.attribute.delete({ where: { id } }); break; case "attribute-values": await prisma.attributeValue.delete({ where: { id } }); break; case "article-categories": await prisma.articleCategory.delete({ where: { id } }); break; }
  await recordActivity({ adminId: admin.id, action: "DELETE", entityType: resource, entityId: id }); revalidatePath(`/admin/catalog/${resource}`);
}
