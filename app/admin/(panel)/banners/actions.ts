"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { deleteOrphanedMedia } from "@/lib/admin/media";
import { isStaleVersion, validateBilingualPublish, type ActionResult } from "@/lib/admin/validation";

const optional = z.string().trim().optional().default("");

const formSchema = z.object({
  id: z.coerce.number().int().positive().optional().or(z.literal("")),
  updatedAt: z.string().optional(),
  type: z.enum(["HOMEPAGE", "PROMOTION"]),
  titleTh: z.string().trim(),
  titleEn: z.string().trim(),
  subtitleTh: optional,
  subtitleEn: optional,
  descriptionTh: optional,
  descriptionEn: optional,
  imageUrl: z.string().trim(),
  linkUrl: optional,
  buttonTextTh: optional,
  buttonTextEn: optional,
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  promotionId: z.preprocess((value) => (value === "none" || value === "" ? undefined : value), z.coerce.number().int().positive().optional()),
  startDate: optional,
  endDate: optional,
  intent: z.enum(["draft", "publish"]),
});

function refreshBanners() {
  revalidatePath("/admin/banners");
  revalidatePath("/");
  revalidatePath("/en");
  revalidatePath("/news");
  revalidatePath("/en/news");
}

export async function saveBannerAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = formSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "กรุณาตรวจสอบข้อมูล", fieldErrors: parsed.error.flatten().fieldErrors };

  const data = parsed.data;
  const isPromotion = data.type === "PROMOTION";
  const published = data.intent === "publish";
  const fieldErrors = validateBilingualPublish({ titleTh: data.titleTh, titleEn: data.titleEn }, published);
  if (!data.imageUrl) fieldErrors.imageUrl = ["กรุณาเลือกรูปแบนเนอร์"];
  // A published promotion banner must point at a promotion so it can be clicked through.
  if (isPromotion && published && !data.promotionId) fieldErrors.promotionId = ["กรุณาเลือกโปรโมชั่นที่เชื่อมโยงก่อนเผยแพร่"];
  if (Object.keys(fieldErrors).length) return { success: false, message: "กรุณากรอกข้อมูลให้ครบก่อนบันทึก", fieldErrors };

  const prisma = getPrisma();
  const id = typeof data.id === "number" ? data.id : undefined;

  let oldImage: string | null = null;
  if (id) {
    const existing = await prisma.banner.findUnique({ where: { id }, select: { imageUrl: true, updatedAt: true } });
    if (!existing) return { success: false, message: "ไม่พบแบนเนอร์ที่ต้องการแก้ไข" };
    if (data.updatedAt && isStaleVersion(data.updatedAt, existing.updatedAt)) return { success: false, conflict: true, message: "ข้อมูลถูกแก้ไขจากอีกหน้าต่าง กรุณาโหลดหน้าใหม่" };
    oldImage = existing.imageUrl;
  }

  const values = {
    titleTh: data.titleTh,
    titleEn: data.titleEn,
    subtitleTh: data.subtitleTh || null,
    subtitleEn: data.subtitleEn || null,
    descriptionTh: data.descriptionTh || null,
    descriptionEn: data.descriptionEn || null,
    imageUrl: data.imageUrl,
    buttonTextTh: data.buttonTextTh || null,
    buttonTextEn: data.buttonTextEn || null,
    sortOrder: data.sortOrder,
    published,
    // Homepage banners use a free link; promotion banners link via the promotion relation.
    linkUrl: isPromotion ? null : data.linkUrl || null,
    promotionId: isPromotion ? data.promotionId ?? null : null,
    startDate: isPromotion && data.startDate ? new Date(data.startDate) : null,
    endDate: isPromotion && data.endDate ? new Date(data.endDate) : null,
  };

  try {
    const saved = id
      ? await prisma.banner.update({ where: { id }, data: values })
      : await prisma.banner.create({ data: { ...values, type: data.type } });

    await recordActivity({ adminId: admin.id, action: id ? (published ? "PUBLISH" : "UPDATE") : "CREATE", entityType: "banners", entityId: saved.id, label: data.titleTh, metadata: { published, type: data.type } });
    refreshBanners();
    if (oldImage && oldImage !== data.imageUrl) await deleteOrphanedMedia([oldImage]);
    return { success: true, message: "บันทึกแบนเนอร์สำเร็จ" };
  } catch {
    return { success: false, message: "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่" };
  }
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("Invalid banner request");
  const prisma = getPrisma();
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new Error("Banner not found");
  if (existing.published) throw new Error("Unpublish banner before permanent deletion");

  await prisma.banner.delete({ where: { id } });
  await recordActivity({ adminId: admin.id, action: "DELETE", entityType: "banners", entityId: id, label: existing.titleTh });
  await deleteOrphanedMedia([existing.imageUrl]);
  refreshBanners();
}
