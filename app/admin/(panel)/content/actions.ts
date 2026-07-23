"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { contentConfigs, isContentResource } from "@/lib/admin/content-config";
import { sanitizeRichHtml } from "@/lib/admin/security";
import { fallbackToken, isUniqueConstraintError } from "@/lib/admin/slug";
import { isStaleVersion, slugifyAdminTitle, validateBilingualPublish, type ActionResult } from "@/lib/admin/validation";

const formSchema = z.object({
  resource: z.string(),
  id: z.coerce.number().int().positive().optional().or(z.literal("")),
  updatedAt: z.string().optional(),
  // Hidden from non-technical admins and generated from the English title; a
  // typed value (from the advanced section) is still honoured, just sanitized.
  slug: z.string().trim().optional().default(""),
  titleTh: z.string().trim(),
  titleEn: z.string().trim(),
  bodyTh: z.string(),
  bodyEn: z.string(),
  excerptTh: z.string().optional().default(""),
  excerptEn: z.string().optional().default(""),
  coverImage: z.string().trim().optional().default(""),
  categoryId: z.preprocess((value) => value === "none" || value === "" ? undefined : value, z.coerce.number().int().positive().optional()),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  intent: z.enum(["draft", "publish"]),
});

function refreshResource(resource: keyof typeof contentConfigs, slug?: string) {
  const config = contentConfigs[resource];
  revalidatePath(`/admin/content/${resource}`);
  revalidatePath(config.publicPath);
  revalidatePath(`/en${config.publicPath}`);
  if (slug) {
    const detailBase = resource === "promotions" ? "/promotions" : config.publicPath;
    revalidatePath(`${detailBase}/${slug}`);
    revalidatePath(`/en${detailBase}/${slug}`);
  }
}

export async function saveContentAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = formSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "กรุณาตรวจสอบข้อมูล", fieldErrors: parsed.error.flatten().fieldErrors };
  if (!isContentResource(parsed.data.resource)) return { success: false, message: "ประเภทเนื้อหาไม่ถูกต้อง" };

  const resource = parsed.data.resource;
  const config = contentConfigs[resource];
  const published = parsed.data.intent === "publish";
  const fieldErrors = validateBilingualPublish({ titleTh: parsed.data.titleTh, titleEn: parsed.data.titleEn, contentTh: parsed.data.bodyTh, contentEn: parsed.data.bodyEn }, published);
  if (Object.keys(fieldErrors).length) return { success: false, message: "กรุณากรอกข้อมูลสองภาษาให้ครบก่อนเผยแพร่", fieldErrors };

  const prisma = getPrisma();
  const id = typeof parsed.data.id === "number" ? parsed.data.id : undefined;
  if (id && parsed.data.updatedAt) {
    const existing = await (async () => {
      switch (resource) {
        case "works": return prisma.work.findUnique({ where: { id }, select: { updatedAt: true } });
        case "articles": return prisma.article.findUnique({ where: { id }, select: { updatedAt: true } });
        case "news": return prisma.news.findUnique({ where: { id }, select: { updatedAt: true } });
        case "promotions": return prisma.promotion.findUnique({ where: { id }, select: { updatedAt: true } });
      }
    })();
    if (!existing) return { success: false, message: "ไม่พบรายการที่ต้องการแก้ไข" };
    if (isStaleVersion(parsed.data.updatedAt, existing.updatedAt)) return { success: false, conflict: true, message: "ข้อมูลถูกแก้ไขจากอีกหน้าต่าง กรุณาโหลดหน้าใหม่" };
  }

  // Generate the URL slug from the (optional) typed value or the English title,
  // falling back to a token for Thai-only drafts. Auto-dedupe on collision so a
  // hidden field never blocks the admin with a duplicate error.
  const baseSlug = slugifyAdminTitle(parsed.data.slug || parsed.data.titleEn) || fallbackToken(resource);
  try {
    let slug = baseSlug;
    let saved: { id: number; slug: string } | undefined;
    for (let attempt = 1; ; attempt++) {
      const common = { slug, titleTh: parsed.data.titleTh, titleEn: parsed.data.titleEn, coverImage: parsed.data.coverImage || null, published };
      try {
        saved = await prisma.$transaction(async (tx) => {
          switch (resource) {
            case "works": {
              const data = { ...common, descriptionTh: parsed.data.bodyTh || null, descriptionEn: parsed.data.bodyEn || null, categoryId: typeof parsed.data.categoryId === "number" ? parsed.data.categoryId : null };
              return id ? tx.work.update({ where: { id }, data }) : tx.work.create({ data });
            }
            case "articles": {
              const data = { ...common, contentTh: sanitizeRichHtml(parsed.data.bodyTh), contentEn: sanitizeRichHtml(parsed.data.bodyEn), excerptTh: parsed.data.excerptTh || null, excerptEn: parsed.data.excerptEn || null, articleCategoryId: typeof parsed.data.categoryId === "number" ? parsed.data.categoryId : null };
              return id ? tx.article.update({ where: { id }, data }) : tx.article.create({ data });
            }
            case "news": {
              const data = { ...common, contentTh: sanitizeRichHtml(parsed.data.bodyTh), contentEn: sanitizeRichHtml(parsed.data.bodyEn), excerptTh: parsed.data.excerptTh || null, excerptEn: parsed.data.excerptEn || null };
              return id ? tx.news.update({ where: { id }, data }) : tx.news.create({ data });
            }
            case "promotions": {
              const data = { ...common, contentTh: sanitizeRichHtml(parsed.data.bodyTh), contentEn: sanitizeRichHtml(parsed.data.bodyEn), excerptTh: parsed.data.excerptTh || null, excerptEn: parsed.data.excerptEn || null, startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null, endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null };
              return id ? tx.promotion.update({ where: { id }, data }) : tx.promotion.create({ data });
            }
          }
        });
        break;
      } catch (error) {
        if (isUniqueConstraintError(error) && attempt <= 5) { slug = `${baseSlug}-${attempt + 1}`; continue; }
        throw error;
      }
    }
    if (!saved) return { success: false, message: "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่" };
    await recordActivity({ adminId: admin.id, action: id ? (published ? "PUBLISH" : "UPDATE") : "CREATE", entityType: resource, entityId: saved.id, label: parsed.data.titleTh, metadata: { published } });
    refreshResource(resource, saved.slug);
    return { success: true, message: `บันทึก${config.singular}สำเร็จ` };
  } catch (error) {
    if (isUniqueConstraintError(error)) return { success: false, message: "ลิงก์ของรายการนี้ซ้ำกับที่มีอยู่ กรุณาลองใหม่" };
    return { success: false, message: "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่" };
  }
}

export async function deleteContentAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const resource = String(formData.get("resource") || "");
  const id = Number(formData.get("id"));
  if (!isContentResource(resource) || !Number.isInteger(id)) throw new Error("Invalid content request");
  const prisma = getPrisma();
  const existing = await (async () => {
    switch (resource) {
      case "works": return prisma.work.findUnique({ where: { id } });
      case "articles": return prisma.article.findUnique({ where: { id } });
      case "news": return prisma.news.findUnique({ where: { id } });
      case "promotions": return prisma.promotion.findUnique({ where: { id } });
    }
  })();
  if (!existing) throw new Error("Content item not found");
  if (existing.published) throw new Error("Unpublish content before permanent deletion");
  switch (resource) {
    case "works": await prisma.work.delete({ where: { id } }); break;
    case "articles": await prisma.article.delete({ where: { id } }); break;
    case "news": await prisma.news.delete({ where: { id } }); break;
    case "promotions": await prisma.promotion.delete({ where: { id } }); break;
  }
  await recordActivity({ adminId: admin.id, action: "DELETE", entityType: resource, entityId: id, label: existing.titleTh });
  refreshResource(resource);
}
