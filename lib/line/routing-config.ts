import { getPrisma } from "@/lib/prisma";
import type { RoutingConfig } from "@/lib/line/routing";

/**
 * การอ่านค่ากฎเลือกกลุ่มไลน์จากฐานข้อมูล
 *
 * แยกออกจาก `lib/admin/line-routing-data.ts` (ซึ่งเป็น `server-only`) เพราะสคริปต์
 * ใน `scripts/` ต้องอ่านค่าชุดเดียวกันนี้เพื่อเติม `responsibleBranch` ย้อนหลัง และ
 * `server-only` ทำให้ tsx โหลดโมดูลไม่ได้ ส่วนที่เหลือของหลังบ้านยังเรียกผ่าน
 * `lib/admin/line-routing-data.ts` ตามเดิม
 */

/** ตารางตั้งค่าเป็นแถวเดียว เหมือน `SiteSetting` */
export const LINE_ROUTING_SETTING_ID = 1;

/**
 * ค่าที่ใช้เมื่อยังไม่มีแถวในฐานข้อมูล — ว่างทั้งหมด
 *
 * ผลคือไม่มีใบไหนเข้ากลุ่มสำนักงานใหญ่หรือกลุ่มโรงงาน ทุกใบที่จัดส่งตกไปสาขาถลาง
 * ตั้งใจให้เป็นแบบนี้ เพราะการเดาค่าเดิมคืนมาเองอันตรายกว่า — ใบจะวิ่งเข้ากลุ่มที่
 * ไม่มีใครเคยตั้งไว้ migration `20260804120000_add_line_routing_setting` เติมแถวนี้
 * พร้อมค่าเดิมไว้ให้แล้ว จึงเกิดขึ้นได้เฉพาะตอนฐานข้อมูลยังไม่ได้ migrate
 */
export const EMPTY_ROUTING_CONFIG: RoutingConfig = {
  hqDistrictCodes: [],
  factoryCategoryIds: [],
  factoryExcludedSubCategoryIds: [],
  factoryIncludedProductIds: [],
  factoryExcludedProductIds: [],
};

export const routingSettingInclude = {
  factoryCategories: { select: { categoryId: true } },
  factoryExcludedSubs: { select: { subCategoryId: true } },
  factoryProducts: { select: { productId: true, include: true } },
} as const;

type SettingRow = {
  hqDistrictCodes: unknown;
  factoryCategories: { categoryId: number }[];
  factoryExcludedSubs: { subCategoryId: number }[];
  factoryProducts: { productId: number; include: boolean }[];
};

/**
 * คอลัมน์ JSON อ่านกลับมาเป็น `unknown` เสมอ ค่าที่แก้จากหน้าหลังบ้านผ่านการตรวจแล้ว
 * แต่ยังกรองซ้ำที่นี่ เผื่อมีคนแก้ตรงฐานข้อมูลจนได้ค่าที่ไม่ใช่ลิสต์ของ string
 */
function toDistrictCodes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((code): code is string => typeof code === "string" && code !== "");
}

export function toRoutingConfig(setting: SettingRow): RoutingConfig {
  return {
    hqDistrictCodes: toDistrictCodes(setting.hqDistrictCodes),
    factoryCategoryIds: setting.factoryCategories.map((row) => row.categoryId),
    factoryExcludedSubCategoryIds: setting.factoryExcludedSubs.map((row) => row.subCategoryId),
    factoryIncludedProductIds: setting.factoryProducts
      .filter((row) => row.include)
      .map((row) => row.productId),
    factoryExcludedProductIds: setting.factoryProducts
      .filter((row) => !row.include)
      .map((row) => row.productId),
  };
}

/** ค่าที่ `resolveSaleGroup()` ต้องใช้ อ่านครั้งเดียวต่อการตัดสินหนึ่งครั้ง */
export async function getLineRoutingConfig(): Promise<RoutingConfig> {
  const setting = await getPrisma().lineRoutingSetting.findUnique({
    where: { id: LINE_ROUTING_SETTING_ID },
    include: routingSettingInclude,
  });

  if (!setting) {
    console.warn("[line] ยังไม่มีแถวตั้งค่ากฎเลือกกลุ่มไลน์ ทุกใบที่จัดส่งจะตกไปสาขาถลาง");
    return EMPTY_ROUTING_CONFIG;
  }
  return toRoutingConfig(setting);
}
