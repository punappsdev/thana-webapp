import "server-only";

import { getPrisma } from "@/lib/prisma";

/** The settings row is a singleton — every read and write targets this id. */
export const SITE_SETTING_ID = 1;

export type SiteSettings = {
  /** โหมดไว้อาลัย: หน้าแรกแสดงเป็นโทนขาวดำ */
  mourningMode: boolean;
  /** โหมดปิดปรับปรุง: แสดงหน้าปิดปรับปรุงแทนเว็บสาธารณะทั้งหมด */
  maintenanceMode: boolean;
  maintenanceTitleTh: string | null;
  maintenanceMessageTh: string | null;
  maintenanceTitleEn: string | null;
  maintenanceMessageEn: string | null;
  updatedAt: Date | null;
};

/**
 * Falls back to "everything off" when the row is missing so the public site
 * still renders on a database that has not run the seed insert yet.
 */
export const SITE_SETTINGS_DEFAULT: SiteSettings = {
  mourningMode: false,
  maintenanceMode: false,
  maintenanceTitleTh: null,
  maintenanceMessageTh: null,
  maintenanceTitleEn: null,
  maintenanceMessageEn: null,
  updatedAt: null,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await getPrisma().siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: {
      mourningMode: true,
      maintenanceMode: true,
      maintenanceTitleTh: true,
      maintenanceMessageTh: true,
      maintenanceTitleEn: true,
      maintenanceMessageEn: true,
      updatedAt: true,
    },
  });
  return row ?? SITE_SETTINGS_DEFAULT;
}

export type MaintenanceText = { title: string; message: string };

/**
 * ข้อความหน้าปิดปรับปรุงตาม locale โดยถ้ายังไม่เคยตั้งค่า (null) จะใช้ข้อความ
 * เริ่มต้นในตัว — หน้าจะไม่มีทางว่างเปล่าแม้แอดมินเปิดโหมดแต่ยังไม่กรอกข้อความ
 */
export function getMaintenanceText(settings: SiteSettings, locale: string): MaintenanceText {
  if (locale === "en") {
    return {
      title: settings.maintenanceTitleEn ?? "Website Under Maintenance",
      message:
        settings.maintenanceMessageEn ??
        "We apologize for the inconvenience. Please check back later.",
    };
  }
  return {
    title: settings.maintenanceTitleTh ?? "เว็บไซต์อยู่ระหว่างการปรับปรุง",
    message:
      settings.maintenanceMessageTh ??
      "ขออภัยในความไม่สะดวก โปรดกลับมาเยี่ยมชมใหม่ในภายหลัง",
  };
}
