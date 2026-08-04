"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { LOGIN_WINDOW_MS, shouldThrottleLogin } from "@/lib/admin/auth-policy";
import { createAdminSession, destroyAdminSession, getAdminSession } from "@/lib/admin/auth";
import { getClientIp } from "@/lib/admin/client-ip";
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

  const { email, password } = parsed.data;
  const prisma = getPrisma();
  const clientIp = await getClientIp();
  const userAgent = (await headers()).get("user-agent") ?? undefined;
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);

  // Two independent counters rather than one keyed on both fields. Counting
  // email AND address together meant either half could be varied to escape the
  // limit: a rented address pool against one account, or one host walking a
  // password across every account, both stayed under the threshold forever.
  const [perAccount, perIp] = await Promise.all([
    prisma.adminLoginAttempt.count({
      where: { email, success: false, createdAt: { gte: since } },
    }),
    clientIp
      ? prisma.adminLoginAttempt.count({
          where: { ipAddress: clientIp, success: false, createdAt: { gte: since } },
        })
      : Promise.resolve(null),
  ]);
  if (shouldThrottleLogin({ perAccount, perIp })) {
    return { success: false, message: "มีการลองเข้าสู่ระบบหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่" };
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const passwordMatches = user?.active
    ? await verifyAdminPassword(user.passwordHash, password)
    : (await hashAdminPassword(password), false);

  await prisma.adminLoginAttempt.create({
    data: {
      email,
      ipAddress: clientIp ?? "unknown",
      success: Boolean(user?.active && passwordMatches),
    },
  });
  if (!user?.active || !passwordMatches) return genericFailure();

  // Proving the password clears the account's streak, so an admin who mistyped
  // a few times before getting in is not left one slip from a lockout.
  await prisma.adminLoginAttempt.deleteMany({ where: { email, success: false } });

  await createAdminSession(user.id, { ipAddress: clientIp ?? undefined, userAgent });
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
