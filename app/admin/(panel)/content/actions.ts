"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { contentConfigs, isContentResource } from "@/lib/admin/content-config";
import { sanitizeRichHtml } from "@/lib/admin/security";
import { isStaleVersion, slugifyAdminTitle, validateBilingualPublish, type ActionResult } from "@/lib/admin/validation";

const formSchema = z.object({
  resource: z.string(),
  id: z.coerce.number().int().positive().optional().or(z.literal("")),
  updatedAt: z.string().optional(),
  slug: z.string().trim().min(1, "กรุณากรอก Slug").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug ใช้ได้เฉพาะ a-z, 0-9 และขีดกลาง"),
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

  const common = { slug: parsed.data.slug || slugifyAdminTitle(parsed.data.titleEn), titleTh: parsed.data.titleTh, titleEn: parsed.data.titleEn, coverImage: parsed.data.coverImage || null, published };
  try {
    const saved = await prisma.$transaction(async (tx) => {
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
    await recordActivity({ adminId: admin.id, action: id ? (published ? "PUBLISH" : "UPDATE") : "CREATE", entityType: resource, entityId: saved.id, label: parsed.data.titleTh, metadata: { published } });
    refreshResource(resource, saved.slug);
    return { success: true, message: `บันทึก${config.singular}สำเร็จ` };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) return { success: false, fieldErrors: { slug: ["Slug นี้ถูกใช้งานแล้ว"] }, message: "Slug นี้ถูกใช้งานแล้ว" };
    return { success: false, message: "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่" };
  }
}

export async function deleteContentAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const resource = String(formData.get("resource") || "");
  const id = Number(formData.get("id"));
  const confirmation = String(formData.get("confirmation") || "");
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
  if (!existing || confirmation !== existing.titleTh) throw new Error("Delete confirmation does not match");
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
