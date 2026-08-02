import "server-only";

import { getPrisma } from "@/lib/prisma";

/** The settings row is a singleton — every read and write targets this id. */
export const SITE_SETTING_ID = 1;

export type SiteSettings = {
  /** โหมดไว้อาลัย: หน้าแรกแสดงเป็นโทนขาวดำ */
  mourningMode: boolean;
  updatedAt: Date | null;
};

/**
 * Falls back to "everything off" when the row is missing so the public site
 * still renders on a database that has not run the seed insert yet.
 */
export const SITE_SETTINGS_DEFAULT: SiteSettings = { mourningMode: false, updatedAt: null };

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await getPrisma().siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { mourningMode: true, updatedAt: true },
  });
  return row ?? SITE_SETTINGS_DEFAULT;
}
