import "server-only";

import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import {
  EMPTY_ROUTING_CONFIG,
  LINE_ROUTING_SETTING_ID,
  toRoutingConfig,
} from "@/lib/line/routing-config";
import type { RoutingConfig } from "@/lib/line/routing";

/**
 * การอ่านค่ากฎย้ายไปอยู่ที่ `lib/line/routing-config.ts` เพราะสคริปต์ใน `scripts/`
 * เรียกใช้ด้วย และ `server-only` ด้านบนทำให้ tsx โหลดไฟล์นี้ไม่ได้ ผู้เรียกเดิม
 * ยัง import จากที่นี่ได้เหมือนเดิม
 */
export { LINE_ROUTING_SETTING_ID, getLineRoutingConfig } from "@/lib/line/routing-config";

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
      config: EMPTY_ROUTING_CONFIG,
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
