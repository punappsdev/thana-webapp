import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE_OPTIONS,
  ADMIN_SESSION_DURATION_MS,
} from "@/lib/admin/constants";
import { createOpaqueToken, hashSessionToken } from "@/lib/admin/security";
import { isSessionExpired, renewedSessionExpiry } from "@/lib/admin/auth-policy";

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
};

/** Thrown by `requireAdminApi` so route handlers can answer 401 JSON. */
export class AdminUnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AdminUnauthorizedError";
  }
}

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
    ...ADMIN_SESSION_COOKIE_OPTIONS,
    expires: expiresAt,
  });
  return expiresAt;
}

/**
 * The one place a request's identity is established. Memoised for the render
 * pass so the layout, the page and every data function it calls share a single
 * lookup instead of one query each.
 */
export const getAdminSession = cache(async (): Promise<AdminSessionUser | null> => {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const prisma = getPrisma();
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });
  if (!session || !session.user.active || isSessionExpired(session.expiresAt)) {
    // Concurrent requests can race to clear the same dead row; losing that race
    // is the outcome we wanted anyway.
    if (session) {
      await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  // Slide the stored expiry to match the cookie proxy.ts keeps refreshing, so
  // an admin who is still working is not signed out mid-form. Best effort: a
  // failed renewal costs an early sign-out, never access.
  const renewed = renewedSessionExpiry(session);
  if (renewed) {
    await prisma.adminSession
      .update({ where: { id: session.id }, data: { expiresAt: renewed } })
      .catch(() => {});
  }

  return { id: session.user.id, email: session.user.email, name: session.user.name };
});

/**
 * Gate for pages, Server Actions and every admin data function. Sends the
 * browser to the login screen rather than throwing, so an expired session
 * during a long edit lands on a sign-in form instead of an error page.
 */
export async function requireAdmin(): Promise<AdminSessionUser> {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");
  return user;
}

/** Reads better in page components; identical behaviour to `requireAdmin`. */
export const requireAdminPage = requireAdmin;

/**
 * Gate for route handlers. Throws instead of redirecting: `fetch` callers want
 * a 401 they can branch on, not an HTML login page with a 200 on it.
 */
export async function requireAdminApi(): Promise<AdminSessionUser> {
  const user = await getAdminSession();
  if (!user) throw new AdminUnauthorizedError();
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
  cookieStore.delete({
    name: ADMIN_SESSION_COOKIE,
    path: ADMIN_SESSION_COOKIE_OPTIONS.path,
  });
}
