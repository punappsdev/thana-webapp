import { toBranchCode, type SaleGroupCode } from "@/lib/branches";
import { findDistrict } from "@/lib/districts";
import { PHUKET_CODE } from "@/lib/provinces";

/**
 * เลือกกลุ่ม LINE ของทีมขายที่ควรได้รับคำขอใบเสนอราคาแต่ละใบ
 *
 * แยกเป็นโมดูลบริสุทธิ์เพราะกฎชุดนี้เป็นข้อตกลงทางธุรกิจที่แก้บ่อยกว่าโค้ดส่วนอื่น
 * และต้องทดสอบได้โดยไม่ต้องมีฐานข้อมูลหรือ token ของ LINE (แนวเดียวกับ
 * `lib/admin/auth-policy.ts` ที่แยกออกจาก `lib/admin/auth.ts`)
 */

/** หมวดหลักของสินค้ากระจกทั้งหมด — ดู `prisma/seed.ts` (categoryData) */
const GLASS_CATEGORY_SLUG = "glass";

/** หมวดย่อย "กระจกตกแต่ง" ซึ่งโรงงานไม่รับ สังเกตว่าเป็น decorate- ไม่ใช่ decorative- */
const DECORATIVE_GLASS_SUBCATEGORY_SLUG = "decorate-glass";

/**
 * อ.เมืองภูเก็ต (8301) และ อ.กะทู้ (8302) — รหัสจาก `lib/data/thai-districts.json`
 * ใช้รหัสแทนชื่อ เพราะชื่อที่ลูกค้าเลือกถูกเก็บเป็นภาษาไทยหรืออังกฤษก็ได้
 */
const HEADQUARTERS_DISTRICT_CODES = ["8301", "8302"];

/**
 * สินค้าที่ส่งเข้ากลุ่มโรงงานเสมอ แม้จะอยู่ในหมวดย่อยกระจกตกแต่งก็ตาม
 *
 * เทียบด้วย "ชื่อขึ้นต้นด้วย" เพื่อให้ครอบสินค้าหลายตัวที่แตกรุ่นจากชื่อเดียวกัน
 * เช่น "กระจกพ่นทราย 6 มม." — ถ้าเปลี่ยนชื่อสินค้าในหลังบ้านต้องมาแก้ที่นี่ด้วย
 */
const FACTORY_ALWAYS_NAME_PREFIXES = ["กระจกพ่นทราย"];

/** สินค้าที่ไม่ส่งเข้ากลุ่มโรงงาน แม้จะอยู่ในหมวดกระจกก็ตาม */
const FACTORY_NEVER_NAME_PREFIXES = ["กระจกลายดอกพิกุลเศรษฐี"];

export type RoutingItem = {
  /** slug หมวดหลักของสินค้าปัจจุบัน null เมื่อสินค้าถูกลบหรือยังไม่ผูกหมวด */
  categorySlug: string | null;
  subCategorySlug: string | null;
  productNameTh: string | null;
};

export type RoutingInput = {
  /** false = ลูกค้าเลือกไปรับสินค้าเองที่สาขา จึงไม่มีที่อยู่จัดส่งให้ตัดสิน */
  needDelivery: boolean;
  contactBranch: string;
  deliveryProvince: string | null;
  deliveryDistrict: string | null;
  items: RoutingItem[];
};

/** `reason` เป็นภาษาไทย แสดงทั้งในการ์ด LINE และหน้าหลังบ้าน ให้ทีมงานเห็นที่มาของการตัดสิน */
export type SaleGroupDecision = { group: SaleGroupCode; reason: string };

/** ยุบช่องว่างซ้ำก่อนเทียบ เพราะชื่อสินค้าที่คีย์เข้ามาอาจมีเว้นวรรคเกิน */
function normalizeName(value: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function startsWithAny(name: string, prefixes: string[]): boolean {
  return name !== "" && prefixes.some((prefix) => name.startsWith(prefix));
}

/**
 * "กระจกเกณฑ์โรงงาน" คือกระจกทุกชนิด ยกเว้นหมวดย่อยกระจกตกแต่งและกระจกลายดอก
 * พิกุลเศรษฐี โดยกระจกพ่นทรายเป็นข้อยกเว้นซ้อนข้อยกเว้น — อยู่ในกระจกตกแต่งแต่
 * โรงงานรับทำ
 *
 * สินค้าที่ถูกลบออกจากแคตตาล็อกแล้วจะอ่านหมวดไม่ได้ (`categorySlug === null`) จึง
 * นับว่าไม่เข้าเกณฑ์ ผลคือทั้งใบตกไปสาขาถลาง ซึ่งปลอดภัยกว่าเดาว่าเป็นกระจก
 */
function isFactoryGlass(item: RoutingItem): boolean {
  if (item.categorySlug !== GLASS_CATEGORY_SLUG) return false;

  const name = normalizeName(item.productNameTh);
  if (startsWithAny(name, FACTORY_ALWAYS_NAME_PREFIXES)) return true;
  if (startsWithAny(name, FACTORY_NEVER_NAME_PREFIXES)) return false;

  return item.subCategorySlug !== DECORATIVE_GLASS_SUBCATEGORY_SLUG;
}

/**
 * กฎตามลำดับ:
 * 1. รับสินค้าเองที่สาขา → กลุ่มของสาขานั้น (ไม่มีที่อยู่จัดส่งให้พิจารณา)
 * 2. จัดส่งใน อ.เมืองภูเก็ต หรือ อ.กะทู้ → สำนักงานใหญ่
 * 3. จัดส่งนอกพื้นที่ข้อ 2 และทุกรายการเป็นกระจกเกณฑ์โรงงาน → สาขาโรงงาน
 * 4. นอกเหนือจากนั้น → สาขาถลาง
 */
export function resolveSaleGroup(input: RoutingInput): SaleGroupDecision {
  if (!input.needDelivery) {
    const branch = toBranchCode(input.contactBranch);
    return { group: branch, reason: "ลูกค้าเลือกไปรับสินค้าเองที่สาขานี้" };
  }

  const district = findDistrict(input.deliveryProvince, input.deliveryDistrict);
  if (
    input.deliveryProvince === PHUKET_CODE &&
    district &&
    HEADQUARTERS_DISTRICT_CODES.includes(district.code)
  ) {
    return {
      group: "headquarters",
      reason: `จัดส่งใน อ.${district.nameTh} จ.ภูเก็ต ซึ่งสำนักงานใหญ่ดูแล`,
    };
  }

  // ตะกร้าว่างเป็นไปไม่ได้จากฟอร์ม แต่กันไว้ไม่ให้ every() คืน true แล้วส่งผิดกลุ่ม
  if (input.items.length > 0 && input.items.every(isFactoryGlass)) {
    return {
      group: "factory",
      reason: "สินค้าทั้งใบเป็นกระจกที่โรงงานรับทำ และจัดส่งนอก อ.เมืองภูเก็ต / อ.กะทู้",
    };
  }

  return { group: "thalang", reason: "จัดส่งนอก อ.เมืองภูเก็ต / อ.กะทู้" };
}
