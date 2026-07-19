"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { LOGIN_WINDOW_MS, shouldThrottleLogin } from "@/lib/admin/auth-policy";
import { createAdminSession, destroyAdminSession, getAdminSession } from "@/lib/admin/auth";
import { hashAdminPassword, verifyAdminPassword } from "@/lib/admin/security";
import { recordActivity } from "@/lib/admin/audit";
import type { ActionResult } from "@/lib/admin/validation";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

function genericFailure(): ActionResult {
  return { success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่" };
}

export async function loginAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return genericFailure();

  const headerStore = await headers();
  const ipAddress = (headerStore.get("x-forwarded-for")?.split(",")[0] || headerStore.get("x-real-ip") || "unknown").trim().slice(0, 64);
  const userAgent = headerStore.get("user-agent") ?? undefined;
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);
  const failedAttempts = await getPrisma().adminLoginAttempt.count({
    where: { email: parsed.data.email, ipAddress, success: false, createdAt: { gte: since } },
  });
  if (shouldThrottleLogin(failedAttempts)) {
    return { success: false, message: "มีการลองเข้าสู่ระบบหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่" };
  }

  const user = await getPrisma().adminUser.findUnique({ where: { email: parsed.data.email } });
  const passwordMatches = user?.active
    ? await verifyAdminPassword(user.passwordHash, parsed.data.password)
    : (await hashAdminPassword(parsed.data.password), false);

  await getPrisma().adminLoginAttempt.create({
    data: { email: parsed.data.email, ipAddress, success: Boolean(user?.active && passwordMatches) },
  });
  if (!user?.active || !passwordMatches) return genericFailure();

  await createAdminSession(user.id, { ipAddress, userAgent });
  await recordActivity({ adminId: user.id, action: "LOGIN", entityType: "AdminUser", entityId: user.id, label: user.email });
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const user = await getAdminSession();
  await destroyAdminSession();
  if (user) {
    await recordActivity({ adminId: user.id, action: "LOGOUT", entityType: "AdminUser", entityId: user.id, label: user.email });
  }
  redirect("/admin/login");
}
