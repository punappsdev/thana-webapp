"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { deleteOrphanedMedia } from "@/lib/admin/media";
import { isStaleVersion, type ActionResult, type FieldErrors } from "@/lib/admin/validation";

const optional = z.string().trim().optional().default("");

const formSchema = z.object({
  id: z.coerce.number().int().positive().optional().or(z.literal("")),
  updatedAt: z.string().optional(),
  name: z.string().trim(),
  imageUrl: optional,
  altTh: optional,
  altEn: optional,
  linkUrl: optional,
  startDate: optional,
  endDate: optional,
  frequency: z.enum(["ALWAYS", "ONCE_PER_SESSION", "ONCE_PER_DAY"]),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  intent: z.enum(["draft", "publish"]),
});

/** The popup only ever renders on the homepage, so both locale roots are enough. */
function refreshPopups() {
  revalidatePath("/admin/popups");
  revalidatePath("/");
  revalidatePath("/en");
}

/** `datetime-local` gives a local wall-clock string; anything unparsable is dropped. */
function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function savePopupAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = formSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "กรุณาตรวจสอบข้อมูล", fieldErrors: parsed.error.flatten().fieldErrors };

  const data = parsed.data;
  const published = data.intent === "publish";
  const startDate = parseDateInput(data.startDate);
  const endDate = parseDateInput(data.endDate);

  const fieldErrors: FieldErrors = {};
  if (!data.name) fieldErrors.name = ["กรุณาตั้งชื่อรายการเพื่อให้ค้นหาได้ภายหลัง"];
  if (!data.imageUrl) fieldErrors.imageUrl = ["กรุณาเลือกรูป Popup"];
  if (startDate && endDate && endDate <= startDate) fieldErrors.endDate = ["วันสิ้นสุดต้องอยู่หลังวันเริ่มต้น"];
  // Publishing something already past its window would silently show nothing.
  else if (published && endDate && endDate <= new Date()) fieldErrors.endDate = ["วันสิ้นสุดผ่านไปแล้ว Popup จะไม่แสดง กรุณาแก้ไขก่อนเผยแพร่"];
  if (Object.keys(fieldErrors).length) return { success: false, message: "กรุณากรอกข้อมูลให้ครบก่อนบันทึก", fieldErrors };

  const prisma = getPrisma();
  const id = typeof data.id === "number" ? data.id : undefined;

  let oldImage: string | null = null;
  if (id) {
    const existing = await prisma.promotionPopup.findUnique({ where: { id }, select: { imageUrl: true, updatedAt: true } });
    if (!existing) return { success: false, message: "ไม่พบ Popup ที่ต้องการแก้ไข" };
    if (data.updatedAt && isStaleVersion(data.updatedAt, existing.updatedAt)) return { success: false, conflict: true, message: "ข้อมูลถูกแก้ไขจากอีกหน้าต่าง กรุณาโหลดหน้าใหม่" };
    oldImage = existing.imageUrl;
  }

  const values = {
    name: data.name,
    imageUrl: data.imageUrl,
    altTh: data.altTh || null,
    altEn: data.altEn || null,
    linkUrl: data.linkUrl || null,
    startDate,
    endDate,
    frequency: data.frequency,
    sortOrder: data.sortOrder,
    published,
  };

  try {
    const saved = id
      ? await prisma.promotionPopup.update({ where: { id }, data: values })
      : await prisma.promotionPopup.create({ data: values });

    await recordActivity({ adminId: admin.id, action: id ? (published ? "PUBLISH" : "UPDATE") : "CREATE", entityType: "popups", entityId: saved.id, label: data.name, metadata: { published, frequency: data.frequency } });
    refreshPopups();
    if (oldImage && oldImage !== data.imageUrl) await deleteOrphanedMedia([oldImage]);
    return { success: true, message: "บันทึก Popup สำเร็จ" };
  } catch {
    return { success: false, message: "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่" };
  }
}

/**
 * "Show this one" from the list: makes `id` win the priority sort outright
 * instead of asking the admin to reason about numbers. Everything else is
 * pushed to at least 1 so the chosen row at 0 is strictly lowest.
 */
export async function setPopupLiveAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("Invalid popup request");
  const prisma = getPrisma();
  const existing = await prisma.promotionPopup.findUnique({ where: { id } });
  if (!existing) throw new Error("Popup not found");
  if (!existing.published) throw new Error("Publish the popup before making it live");

  await prisma.$transaction([
    prisma.promotionPopup.updateMany({ where: { id: { not: id }, sortOrder: { lt: 1 } }, data: { sortOrder: 1 } }),
    prisma.promotionPopup.update({ where: { id }, data: { sortOrder: 0 } }),
  ]);

  await recordActivity({ adminId: admin.id, action: "UPDATE", entityType: "popups", entityId: id, label: existing.name, metadata: { madeLive: true } });
  refreshPopups();
}

export async function deletePopupAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("Invalid popup request");
  const prisma = getPrisma();
  const existing = await prisma.promotionPopup.findUnique({ where: { id } });
  if (!existing) throw new Error("Popup not found");
  if (existing.published) throw new Error("Unpublish popup before permanent deletion");

  await prisma.promotionPopup.delete({ where: { id } });
  await recordActivity({ adminId: admin.id, action: "DELETE", entityType: "popups", entityId: id, label: existing.name });
  await deleteOrphanedMedia([existing.imageUrl]);
  refreshPopups();
}
