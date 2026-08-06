import { toBranchCode, type SaleGroupCode } from "@/lib/branches";
import { findDistrict } from "@/lib/districts";
import { provinceName } from "@/lib/provinces";

/**
 * เลือกกลุ่ม LINE ของทีมขายที่ควรได้รับคำขอใบเสนอราคาแต่ละใบ
 *
 * แยกเป็นโมดูลบริสุทธิ์เพราะกฎชุดนี้เป็นข้อตกลงทางธุรกิจที่แก้บ่อยกว่าโค้ดส่วนอื่น
 * และต้องทดสอบได้โดยไม่ต้องมีฐานข้อมูลหรือ token ของ LINE (แนวเดียวกับ
 * `lib/admin/auth-policy.ts` ที่แยกออกจาก `lib/admin/auth.ts`)
 *
 * **ลำดับของกฎอยู่ที่นี่ ส่วนค่าที่ใช้ตัดสินอยู่ในฐานข้อมูล** และแก้จากหน้า
 * `/admin/settings/line-routing` ได้ ผู้เรียกอ่านค่ามาด้วย `getLineRoutingConfig()`
 * (`lib/admin/line-routing-data.ts`) แล้วส่งเข้ามาเป็นอาร์กิวเมนต์ที่สอง
 */

/** ค่าที่ทีมขายปรับได้เอง — ทุกรายการอ้างด้วย id ไม่ใช่ชื่อ การเปลี่ยนชื่อสินค้าจึงไม่กระทบ */
export type RoutingConfig = {
  /** รหัสอำเภอที่สำนักงานใหญ่ดูแล อ้างอิง `lib/data/thai-districts.json` */
  hqDistrictCodes: string[];
  /** หมวดหลักที่โรงงานรับทำ */
  factoryCategoryIds: number[];
  /** หมวดย่อยที่ยกเว้น แม้หมวดหลักจะอยู่ในรายการข้างบน */
  factoryExcludedSubCategoryIds: number[];
  /** สินค้าที่โรงงานรับทำเสมอ ทับผลของหมวดย่อยที่ยกเว้น */
  factoryIncludedProductIds: number[];
  /** สินค้าที่โรงงานไม่รับทำเสมอ ชนะทุกเงื่อนไข */
  factoryExcludedProductIds: number[];
};

export type RoutingItem = {
  /** id ของสินค้าปัจจุบัน null เมื่อสินค้าถูกลบออกจากแคตตาล็อกแล้ว */
  productId: number | null;
  categoryId: number | null;
  subCategoryId: number | null;
};

export type RoutingInput = {
  /** false = ลูกค้าเลือกไปรับสินค้าเองที่สาขา จึงไม่มีที่อยู่จัดส่งให้ตัดสิน */
  needDelivery: boolean;
  /** null เมื่อเลือกจัดส่ง ซึ่งเป็นกรณีที่กฎข้อ 1 ไม่ทำงานอยู่แล้ว */
  contactBranch: string | null;
  deliveryProvince: string | null;
  deliveryDistrict: string | null;
  items: RoutingItem[];
};

/** `reason` เป็นภาษาไทย แสดงทั้งในการ์ด LINE และหน้าหลังบ้าน ให้ทีมงานเห็นที่มาของการตัดสิน */
export type SaleGroupDecision = { group: SaleGroupCode; reason: string };

/**
 * สินค้าที่โรงงานรับทำ ตามค่าที่ตั้งไว้ในหลังบ้าน เรียงจากข้อยกเว้นแคบไปกว้าง
 *
 * สินค้าที่ถูกลบออกจากแคตตาล็อกแล้วจะอ่านหมวดไม่ได้ (`categoryId === null`) จึง
 * นับว่าไม่เข้าเกณฑ์ ผลคือทั้งใบตกไปสาขาถลาง ซึ่งปลอดภัยกว่าเดาว่าโรงงานรับทำ
 */
function isFactoryProduct(item: RoutingItem, config: RoutingConfig): boolean {
  if (item.productId !== null) {
    if (config.factoryExcludedProductIds.includes(item.productId)) return false;
    if (config.factoryIncludedProductIds.includes(item.productId)) return true;
  }

  if (item.categoryId === null) return false;
  if (!config.factoryCategoryIds.includes(item.categoryId)) return false;

  return (
    item.subCategoryId === null ||
    !config.factoryExcludedSubCategoryIds.includes(item.subCategoryId)
  );
}

/**
 * กฎตามลำดับ:
 * 1. รับสินค้าเองที่สาขา → กลุ่มของสาขานั้น (ไม่มีที่อยู่จัดส่งให้พิจารณา)
 * 2. จัดส่งไปอำเภอที่สำนักงานใหญ่ดูแล → สำนักงานใหญ่
 * 3. จัดส่งนอกพื้นที่ข้อ 2 และทุกรายการเป็นสินค้าที่โรงงานรับทำ → สาขาโรงงาน
 * 4. นอกเหนือจากนั้น → สาขาถลาง
 */
export function resolveSaleGroup(
  input: RoutingInput,
  config: RoutingConfig,
): SaleGroupDecision {
  if (!input.needDelivery) {
    const branch = toBranchCode(input.contactBranch);
    return { group: branch, reason: "ลูกค้าเลือกไปรับสินค้าเองที่สาขานี้" };
  }

  // รหัสอำเภอไม่ซ้ำกันทั้งประเทศ และ findDistrict หาเฉพาะในจังหวัดที่ระบุอยู่แล้ว
  // จึงไม่ต้องเช็กจังหวัดซ้ำ — และตั้งอำเภอนอกภูเก็ตให้สำนักงานใหญ่ดูแลได้ด้วย
  const district = findDistrict(input.deliveryProvince, input.deliveryDistrict);
  if (district && config.hqDistrictCodes.includes(district.code)) {
    const province = provinceName(input.deliveryProvince, "th");
    return {
      group: "headquarters",
      reason: `จัดส่งใน อ.${district.nameTh}${province ? ` จ.${province}` : ""} ซึ่งสำนักงานใหญ่ดูแล`,
    };
  }

  // ตะกร้าว่างเป็นไปไม่ได้จากฟอร์ม แต่กันไว้ไม่ให้ every() คืน true แล้วส่งผิดกลุ่ม
  if (input.items.length > 0 && input.items.every((item) => isFactoryProduct(item, config))) {
    return {
      group: "factory",
      reason: "สินค้าทั้งใบเป็นสินค้าที่โรงงานรับทำ และจัดส่งนอกพื้นที่ที่สำนักงานใหญ่ดูแล",
    };
  }

  return { group: "thalang", reason: "จัดส่งนอกพื้นที่ที่สำนักงานใหญ่ดูแล" };
}
