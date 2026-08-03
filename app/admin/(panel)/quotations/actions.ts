"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { notifyQuotationToLine } from "@/lib/line/notify-quotation";
import { getPrisma } from "@/lib/prisma";

/**
 * Removes a quotation request outright — used for spam and test submissions.
 * The line items go with it via the Cascade on QuotationItem.requestId.
 */
export async function deleteQuotationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("Invalid quotation request");

  const prisma = getPrisma();
  const request = await prisma.quotationRequest.findUniqueOrThrow({
    where: { id },
    select: { code: true, firstName: true, lastName: true },
  });

  await prisma.quotationRequest.delete({ where: { id } });

  await recordActivity({
    adminId: admin.id,
    action: "DELETE",
    entityType: "quotations",
    entityId: id,
    label: request.code,
    metadata: { customer: `${request.firstName} ${request.lastName}`.trim() },
  });

  revalidatePath("/admin/quotations");
}

export type ResendLineResult = { ok: boolean; message: string };

/**
 * ส่งการ์ดแจ้งเตือนเข้ากลุ่ม LINE ของสาขาอีกครั้ง ใช้เมื่อรอบอัตโนมัติตอนลูกค้ากด
 * ส่งพลาดไป (token หมดอายุ, LINE ล่ม, ยังไม่ได้ตั้งค่ากลุ่มของสาขานั้น)
 *
 * คืนผลลัพธ์แทนการ throw เพราะ Next ปกปิดข้อความ error ของ server action ใน
 * production ทีมงานจึงจะไม่มีทางเห็นสาเหตุจริงถ้าโยนออกไป
 */
export async function resendLineNotificationAction(formData: FormData): Promise<ResendLineResult> {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("Invalid quotation request");

  const request = await getPrisma().quotationRequest.findUniqueOrThrow({
    where: { id },
    select: { code: true },
  });

  const result = await notifyQuotationToLine(id);

  await recordActivity({
    adminId: admin.id,
    action: "UPDATE",
    entityType: "quotations",
    entityId: id,
    label: `ส่งแจ้งเตือน LINE ${request.code}`,
    metadata: { lineNotify: result.status },
  });

  revalidatePath(`/admin/quotations/${id}`);
  revalidatePath("/admin/quotations");

  if (result.status === "skipped") return { ok: false, message: result.reason };
  if (result.status === "failed") return { ok: false, message: result.error };
  return { ok: true, message: `ส่งแจ้งเตือน ${request.code} เข้ากลุ่มไลน์ของสาขาแล้ว` };
}
