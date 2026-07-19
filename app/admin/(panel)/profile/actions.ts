"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createAdminSession, requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { getPrisma } from "@/lib/prisma";
import { hashAdminPassword, validateAdminPassword, verifyAdminPassword } from "@/lib/admin/security";
import type { ActionResult } from "@/lib/admin/validation";

const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(1), confirmPassword: z.string().min(1) });

export async function changePasswordAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "กรุณากรอกข้อมูลให้ครบ" };
  if (parsed.data.newPassword !== parsed.data.confirmPassword) return { success: false, fieldErrors: { confirmPassword: ["รหัสผ่านใหม่ไม่ตรงกัน"] }, message: "รหัสผ่านใหม่ไม่ตรงกัน" };
  const policy = validateAdminPassword(parsed.data.newPassword);
  if (!policy.ok) return { success: false, fieldErrors: { newPassword: [policy.message] }, message: policy.message };

  const user = await getPrisma().adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await verifyAdminPassword(user.passwordHash, parsed.data.currentPassword))) return { success: false, fieldErrors: { currentPassword: ["รหัสผ่านปัจจุบันไม่ถูกต้อง"] }, message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  const passwordHash = await hashAdminPassword(parsed.data.newPassword);
  await getPrisma().$transaction([
    getPrisma().adminUser.update({ where: { id: admin.id }, data: { passwordHash, passwordChangedAt: new Date() } }),
    getPrisma().adminSession.deleteMany({ where: { userId: admin.id } }),
  ]);
  const headerStore = await headers();
  await createAdminSession(admin.id, { ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim(), userAgent: headerStore.get("user-agent") || undefined });
  await recordActivity({ adminId: admin.id, action: "PASSWORD_CHANGE", entityType: "AdminUser", entityId: admin.id, label: admin.email });
  return { success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ และออกจากระบบในอุปกรณ์อื่นแล้ว" };
}
