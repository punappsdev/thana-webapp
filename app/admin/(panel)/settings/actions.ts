"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { LINE_ROUTING_SETTING_ID } from "@/lib/admin/line-routing-data";
import { SITE_SETTING_ID } from "@/lib/admin/site-settings";
import { isStaleVersion, type ActionResult } from "@/lib/admin/validation";
import { findDistrictByCode } from "@/lib/districts";

/**
 * ปัด cache ของหน้าตั้งค่าและรากทั้งสอง locale มอร์นนิ่ง/เมนเทนแนนซ์ gate ผ่าน
 * `[locale]` layout ที่ render ต่อ request อยู่แล้ว จึงรากสองตัวนี้เพียงพอ
 */
function refreshSettings() {
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/en");
}

export async function setMourningModeAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const raw = formData.get("enabled");
  if (raw !== "true" && raw !== "false") throw new Error("Invalid mourning mode value");
  const mourningMode = raw === "true";

  await getPrisma().siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: { id: SITE_SETTING_ID, mourningMode },
    update: { mourningMode },
  });

  await recordActivity({
    adminId: admin.id,
    action: "UPDATE",
    entityType: "settings",
    entityId: SITE_SETTING_ID,
    label: mourningMode ? "เปิดโหมดไว้อาลัย" : "ปิดโหมดไว้อาลัย",
    metadata: { mourningMode },
  });

  refreshSettings();
}

/** สวิตช์เปิด/ปิดโหมดปิดปรับปรุงมีผลทันที เช่นเดียวกับโหมดไว้อาลัย */
export async function setMaintenanceModeAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const raw = formData.get("enabled");
  if (raw !== "true" && raw !== "false") throw new Error("Invalid maintenance mode value");
  const maintenanceMode = raw === "true";

  await getPrisma().siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: { id: SITE_SETTING_ID, maintenanceMode },
    update: { maintenanceMode },
  });

  await recordActivity({
    adminId: admin.id,
    action: "UPDATE",
    entityType: "settings",
    entityId: SITE_SETTING_ID,
    label: maintenanceMode ? "เปิดโหมดปิดปรับปรุงเว็บไซต์" : "ปิดโหมดปิดปรับปรุงเว็บไซต์",
    metadata: { maintenanceMode },
  });

  refreshSettings();
}

const maintenanceTextSchema = z.object({
  maintenanceTitleTh: z.string().trim().max(191).optional().default(""),
  maintenanceMessageTh: z.string().trim().max(1000).optional().default(""),
  maintenanceTitleEn: z.string().trim().max(191).optional().default(""),
  maintenanceMessageEn: z.string().trim().max(1000).optional().default(""),
});

/** บันทึกข้อความหน้าปิดปรับปรุงเท่านั้น — ไม่แตะสถานะเปิด/ปิด ข้อความที่เว้นว่าง → null */
export async function saveMaintenanceTextAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = maintenanceTextSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: "กรุณาตรวจสอบข้อมูล",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const fields = {
    maintenanceTitleTh: data.maintenanceTitleTh || null,
    maintenanceMessageTh: data.maintenanceMessageTh || null,
    maintenanceTitleEn: data.maintenanceTitleEn || null,
    maintenanceMessageEn: data.maintenanceMessageEn || null,
  };

  await getPrisma().siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: { id: SITE_SETTING_ID, ...fields },
    update: fields,
  });

  await recordActivity({
    adminId: admin.id,
    action: "UPDATE",
    entityType: "settings",
    entityId: SITE_SETTING_ID,
    label: "แก้ไขข้อความหน้าปิดปรับปรุงเว็บไซต์",
    metadata: fields,
  });

  refreshSettings();
  return { success: true, message: "บันทึกข้อความแล้ว" };
}

/** ช่องเลือกหลายค่าส่งมาเป็นสตริงเดียวคั่นด้วยจุลภาค (components/admin/multi-select-field.tsx) */
function splitList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

const idList = z.string().optional().default("").transform(splitList);

const numberIdList = z
  .string()
  .optional()
  .default("")
  // ค่าที่ไม่ใช่ตัวเลขกลายเป็น NaN แล้วถูก z.number() ปัดตกต่อ ไม่หลุดไปถึงฐานข้อมูล
  .transform((value) => splitList(value).map(Number))
  .pipe(z.array(z.number().int().positive()));

const lineRoutingSchema = z.object({
  updatedAt: z.string().optional(),
  hqDistrictCodes: idList,
  factoryCategoryIds: numberIdList,
  factoryExcludedSubCategoryIds: numberIdList,
  factoryIncludedProductIds: numberIdList,
  factoryExcludedProductIds: numberIdList,
});

/** ตัดค่าซ้ำออกก่อนเขียน เพราะคีย์หลักของตารางลูกเป็น (settingId, id) */
function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/** กฎเลือกกลุ่มไลน์มีผลกับหน้าคำขอใบเสนอราคาในหลังบ้านเท่านั้น เว็บสาธารณะไม่ได้ใช้ */
function refreshLineRouting() {
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/line-routing");
  revalidatePath("/admin/quotations");
}

/**
 * บันทึกพารามิเตอร์ของกฎเลือกกลุ่มไลน์ทีมขาย (ดู lib/line/routing.ts)
 *
 * ตรวจว่า id ทุกตัวยังมีอยู่จริงก่อนเขียน เพราะฟอร์มถืออออปชันที่โหลดมาตอนเปิดหน้า
 * ถ้ามีใครลบสินค้าทิ้งระหว่างนั้น การเขียนจะพังที่ foreign key แล้วผู้ใช้จะเห็นแค่
 * ข้อความผิดพลาดของฐานข้อมูลซึ่งไม่ได้บอกอะไร
 */
export async function saveLineRoutingAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = lineRoutingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: "กรุณาตรวจสอบข้อมูล",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const hqDistrictCodes = unique(data.hqDistrictCodes);
  const categoryIds = unique(data.factoryCategoryIds);
  const subCategoryIds = unique(data.factoryExcludedSubCategoryIds);
  const includedProductIds = unique(data.factoryIncludedProductIds);
  const excludedProductIds = unique(data.factoryExcludedProductIds);

  const unknownDistrict = hqDistrictCodes.find((code) => !findDistrictByCode(code));
  if (unknownDistrict) {
    return {
      success: false,
      message: "กรุณาตรวจสอบข้อมูล",
      fieldErrors: { hqDistrictCodes: [`ไม่รู้จักรหัสอำเภอ ${unknownDistrict}`] },
    };
  }

  // สินค้าตัวเดียวกันอยู่ทั้งสองรายการได้ในทางเทคนิค (คีย์หลักคือ settingId+productId
  // จึงเขียนได้แถวเดียว) แต่ความหมายขัดกัน ให้บอกผู้ใช้แทนที่จะเลือกให้เงียบ ๆ
  const conflicting = includedProductIds.filter((id) => excludedProductIds.includes(id));
  if (conflicting.length > 0) {
    return {
      success: false,
      message: "กรุณาตรวจสอบข้อมูล",
      fieldErrors: {
        factoryExcludedProductIds: [
          "มีสินค้าที่ถูกตั้งไว้ทั้ง “รับทำเสมอ” และ “ไม่รับทำ” กรุณาเลือกอย่างใดอย่างหนึ่ง",
        ],
      },
    };
  }

  const prisma = getPrisma();
  const [existing, categoryCount, subCategoryCount, productCount] = await Promise.all([
    prisma.lineRoutingSetting.findUnique({
      where: { id: LINE_ROUTING_SETTING_ID },
      select: { updatedAt: true },
    }),
    prisma.category.count({ where: { id: { in: categoryIds } } }),
    prisma.subCategory.count({ where: { id: { in: subCategoryIds } } }),
    prisma.product.count({ where: { id: { in: [...includedProductIds, ...excludedProductIds] } } }),
  ]);

  if (existing && data.updatedAt && isStaleVersion(data.updatedAt, existing.updatedAt)) {
    return { success: false, conflict: true, message: "ข้อมูลถูกแก้ไขจากอีกหน้าต่าง กรุณาโหลดหน้าใหม่" };
  }
  if (
    categoryCount !== categoryIds.length ||
    subCategoryCount !== subCategoryIds.length ||
    productCount !== includedProductIds.length + excludedProductIds.length
  ) {
    return {
      success: false,
      message: "มีหมวดหมู่หรือสินค้าที่เลือกไว้ถูกลบไปแล้ว กรุณาโหลดหน้าใหม่แล้วเลือกอีกครั้ง",
    };
  }

  const settingId = LINE_ROUTING_SETTING_ID;
  await prisma.$transaction([
    prisma.lineRoutingSetting.upsert({
      where: { id: settingId },
      create: { id: settingId, hqDistrictCodes },
      update: { hqDistrictCodes },
    }),
    prisma.lineRoutingFactoryCategory.deleteMany({ where: { settingId } }),
    prisma.lineRoutingFactoryExcludedSubCategory.deleteMany({ where: { settingId } }),
    prisma.lineRoutingFactoryProduct.deleteMany({ where: { settingId } }),
    prisma.lineRoutingFactoryCategory.createMany({
      data: categoryIds.map((categoryId) => ({ settingId, categoryId })),
    }),
    prisma.lineRoutingFactoryExcludedSubCategory.createMany({
      data: subCategoryIds.map((subCategoryId) => ({ settingId, subCategoryId })),
    }),
    prisma.lineRoutingFactoryProduct.createMany({
      data: [
        ...includedProductIds.map((productId) => ({ settingId, productId, include: true })),
        ...excludedProductIds.map((productId) => ({ settingId, productId, include: false })),
      ],
    }),
  ]);

  await recordActivity({
    adminId: admin.id,
    action: "UPDATE",
    entityType: "settings",
    entityId: settingId,
    label: "แก้ไขกฎการส่งแจ้งเตือนกลุ่มไลน์ทีมขาย",
    metadata: {
      hqDistrictCodes,
      factoryCategoryIds: categoryIds,
      factoryExcludedSubCategoryIds: subCategoryIds,
      factoryIncludedProductIds: includedProductIds,
      factoryExcludedProductIds: excludedProductIds,
    },
  });

  refreshLineRouting();
  return { success: true, message: "บันทึกกฎการส่งแจ้งเตือนแล้ว" };
}
