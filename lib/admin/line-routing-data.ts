import "server-only";

import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import type { RoutingConfig } from "@/lib/line/routing";

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
const EMPTY_CONFIG: RoutingConfig = {
  hqDistrictCodes: [],
  factoryCategoryIds: [],
  factoryExcludedSubCategoryIds: [],
  factoryIncludedProductIds: [],
  factoryExcludedProductIds: [],
};

const settingInclude = {
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

function toRoutingConfig(setting: SettingRow): RoutingConfig {
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
    include: settingInclude,
  });

  if (!setting) {
    console.warn("[line] ยังไม่มีแถวตั้งค่ากฎเลือกกลุ่มไลน์ ทุกใบที่จัดส่งจะตกไปสาขาถลาง");
    return EMPTY_CONFIG;
  }
  return toRoutingConfig(setting);
}

export type LineRoutingOption = { id: number; label: string; hint?: string };

export type LineRoutingSettings = {
  config: RoutingConfig;
  updatedAt: Date | null;
  /** ชื่อของหมวด/สินค้าที่เลือกไว้ สำหรับแสดงสรุปโดยไม่ต้อง query ซ้ำ */
  selected: {
    categories: LineRoutingOption[];
    excludedSubCategories: LineRoutingOption[];
    includedProducts: LineRoutingOption[];
    excludedProducts: LineRoutingOption[];
  };
};

/**
 * เหมือน `getLineRoutingConfig()` แต่พ่วงชื่อภาษาไทยของทุกรายการที่เลือกไว้มาด้วย
 * ใช้ในการ์ดสรุปหน้าตั้งค่าและฟอร์มแก้ไข ซึ่งต้องแสดงชื่อ ไม่ใช่ id
 */
export async function getLineRoutingSettings(): Promise<LineRoutingSettings> {
  await requireAdmin();
  const setting = await getPrisma().lineRoutingSetting.findUnique({
    where: { id: LINE_ROUTING_SETTING_ID },
    include: {
      factoryCategories: {
        select: { categoryId: true, category: { select: { nameTh: true } } },
      },
      factoryExcludedSubs: {
        select: {
          subCategoryId: true,
          subCategory: { select: { nameTh: true, category: { select: { nameTh: true } } } },
        },
      },
      factoryProducts: {
        select: { productId: true, include: true, product: { select: { nameTh: true, sku: true } } },
      },
    },
  });

  if (!setting) {
    return {
      config: EMPTY_CONFIG,
      updatedAt: null,
      selected: {
        categories: [],
        excludedSubCategories: [],
        includedProducts: [],
        excludedProducts: [],
      },
    };
  }

  const products = setting.factoryProducts.map((row) => ({
    id: row.productId,
    label: row.product.nameTh,
    hint: row.product.sku,
    include: row.include,
  }));

  return {
    config: toRoutingConfig(setting),
    updatedAt: setting.updatedAt,
    selected: {
      categories: setting.factoryCategories.map((row) => ({
        id: row.categoryId,
        label: row.category.nameTh,
      })),
      excludedSubCategories: setting.factoryExcludedSubs.map((row) => ({
        id: row.subCategoryId,
        label: row.subCategory.nameTh,
        hint: row.subCategory.category.nameTh,
      })),
      includedProducts: products.filter((row) => row.include),
      excludedProducts: products.filter((row) => !row.include),
    },
  };
}

/** ตัวเลือกทั้งหมดที่ให้เลือกในฟอร์ม — หมวดพร้อมหมวดย่อย และรายชื่อสินค้า */
export async function getLineRoutingOptions() {
  await requireAdmin();
  const prisma = getPrisma();
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { nameTh: "asc" }],
      select: {
        id: true,
        nameTh: true,
        subCategories: {
          orderBy: [{ sortOrder: "asc" }, { nameTh: "asc" }],
          select: { id: true, nameTh: true },
        },
      },
    }),
    // แคตตาล็อกของโปรเจกต์นี้อยู่ในหลักร้อย ส่งทั้งชุดให้ตัวเลือกค้นหาฝั่งเบราว์เซอร์
    // ได้โดยไม่ต้องทำ endpoint ค้นหาแยก ถ้าวันหนึ่งโตเกินนี้ค่อยเปลี่ยนเป็นค้นฝั่งเซิร์ฟเวอร์
    prisma.product.findMany({
      orderBy: { nameTh: "asc" },
      select: { id: true, nameTh: true, sku: true, categoryId: true },
    }),
  ]);

  return { categories, products };
}

export type LineRoutingOptions = Awaited<ReturnType<typeof getLineRoutingOptions>>;
