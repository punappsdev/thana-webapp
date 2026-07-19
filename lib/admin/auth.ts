import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_DURATION_MS,
} from "@/lib/admin/constants";
import { createOpaqueToken, hashSessionToken } from "@/lib/admin/security";
import { isSessionExpired } from "@/lib/admin/auth-policy";

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
};

export async function createAdminSession(
  userId: string,
  context: { ipAddress?: string; userAgent?: string } = {},
): Promise<Date> {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_DURATION_MS);
  await getPrisma().adminSession.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId,
      expiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent?.slice(0, 512),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return expiresAt;
}

export async function getAdminSession(): Promise<AdminSessionUser | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await getPrisma().adminSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });
  if (!session || !session.user.active || isSessionExpired(session.expiresAt)) {
    if (session) await getPrisma().adminSession.delete({ where: { id: session.id } });
    return null;
  }

  return { id: session.user.id, email: session.user.email, name: session.user.name };
}

export async function requireAdmin(): Promise<AdminSessionUser> {
  const user = await getAdminSession();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdminPage(): Promise<AdminSessionUser> {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");
  return user;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    await getPrisma().adminSession.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
