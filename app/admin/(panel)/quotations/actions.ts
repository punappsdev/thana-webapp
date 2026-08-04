"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { notifyQuotationToLine } from "@/lib/line/notify-quotation";
import { getPrisma } from "@/lib/prisma";
import { removeStoredBoqFile } from "@/lib/quotation-boq";
import { customerRetainUntil, QUOTATION_RETENTION_YEARS } from "@/lib/admin/retention";
import { resolveUploadPath } from "@/lib/admin/security";

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
    select: { code: true, firstName: true, lastName: true, boqStoragePath: true },
  });

  await prisma.quotationRequest.delete({ where: { id } });

  if (request.boqStoragePath) {
    const uploadDir = process.env.UPLOAD_DIR;
    if (!uploadDir) {
      console.error("BOQ file cleanup after quotation deletion skipped: UPLOAD_DIR is not set");
    } else {
      try {
        await removeStoredBoqFile(resolveUploadPath(uploadDir, request.boqStoragePath));
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== "ENOENT") {
          console.error("BOQ file cleanup after quotation deletion failed:", error);
        }
      }
    }
  }

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

export type RetentionHoldResult = { ok: boolean; message: string };

/**
 * ยืดเวลาเก็บข้อมูลของคำขอหนึ่งใบจาก 3 ปีเป็น 10 ปี ตามที่นโยบายความเป็นส่วนตัวกำหนด
 * ไว้สำหรับลูกค้าที่ตกลงสั่งซื้อจริง
 *
 * ตารางนี้ไม่มีฟิลด์สถานะการขาย ระบบจึงแยกเองไม่ได้ว่าใบไหนกลายเป็นออเดอร์ ถ้าไม่มี
 * ปุ่มนี้งาน retention จะลบข้อมูลลูกค้าที่ซื้อจริงทิ้งไปด้วยเมื่อครบ 3 ปี
 */
export async function setRetentionHoldAction(formData: FormData): Promise<RetentionHoldResult> {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("Invalid quotation request");
  const hold = formData.get("hold") === "on";

  const request = await getPrisma().quotationRequest.findUniqueOrThrow({
    where: { id },
    select: { code: true, createdAt: true, anonymizedAt: true },
  });
  if (request.anonymizedAt) {
    return { ok: false, message: "คำขอนี้ถูกลบข้อมูลส่วนบุคคลไปแล้ว จึงไม่มีอะไรให้เก็บต่อ" };
  }

  const retainUntil = hold ? customerRetainUntil(request.createdAt) : null;
  await getPrisma().quotationRequest.update({ where: { id }, data: { retainUntil } });

  await recordActivity({
    adminId: admin.id,
    action: "UPDATE",
    entityType: "quotations",
    entityId: id,
    label: `${hold ? "ขยาย" : "ยกเลิก"}กำหนดเก็บข้อมูล ${request.code}`,
    metadata: { retainUntil: retainUntil?.toISOString() ?? null },
  });

  revalidatePath(`/admin/quotations/${id}`);
  revalidatePath("/admin/quotations");

  return {
    ok: true,
    message: hold
      ? `เก็บข้อมูลของ ${request.code} ไว้ถึง ${retainUntil?.toLocaleDateString("th-TH")}`
      : `${request.code} กลับไปใช้กำหนดเก็บปกติ ${QUOTATION_RETENTION_YEARS} ปี`,
  };
}
