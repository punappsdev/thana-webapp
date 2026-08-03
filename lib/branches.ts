/**
 * สาขาที่ลูกค้าเลือกให้ดูแลคำขอใบเสนอราคา
 *
 * ค่าเหล่านี้ถูก hardcode ซ้ำอยู่หลายที่ (zod enum ในฟอร์ม, radio ในหน้า quote,
 * ป้ายในหลังบ้าน และตอนนี้คือปลายทางกลุ่ม LINE) การรวมไว้ที่เดียวทำให้เพิ่มสาขา
 * ใหม่แล้ว TypeScript ชี้จุดที่ต้องแก้ให้ครบเอง แทนที่จะต้องไล่ grep
 *
 * ตัวโค้ดถูกเก็บลง `QuotationRequest.contactBranch` เป็น VARCHAR ไม่ใช่ enum ของ
 * ฐานข้อมูล คำขอเก่าจึงอาจมีค่าที่ไม่อยู่ในลิสต์นี้ได้ ทุกฟังก์ชันด้านล่างจึงรับ
 * `string` และเผื่อทางออกไว้เสมอ
 */
export const BRANCH_CODES = ["headquarters", "thalang"] as const;

export type BranchCode = (typeof BRANCH_CODES)[number];

/**
 * ปลายทางกลุ่ม LINE ของทีมขาย เป็นซูเปอร์เซตของ `BRANCH_CODES`
 *
 * "factory" ไม่ใช่จุดที่ลูกค้าไปรับสินค้าเองได้ จึงไม่อยู่ใน `BRANCH_CODES` และ
 * ไม่มีลิงก์แผนที่ — มันโผล่ได้เฉพาะตอนระบบเลือกกลุ่มปลายทางให้เท่านั้น
 * (ดู `lib/line/routing.ts`)
 */
export const SALE_GROUP_CODES = ["headquarters", "thalang", "factory"] as const;

export type SaleGroupCode = (typeof SALE_GROUP_CODES)[number];

/** Google Maps links shown for the branches that can handle quote requests. */
export const QUOTE_BRANCH_MAP_URLS: Record<BranchCode, string> = {
  headquarters:
    "https://www.google.com/maps?cid=4933196602655605409&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAMYASAF&hl=th&gl=TH&source=embed",
  thalang:
    "https://www.google.com/maps?cid=9677844337688656532&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAMYASAF&hl=th&gl=TH&source=embed",
};

/** สาขาที่ใช้เมื่อค่าในฐานข้อมูลอ่านไม่ออก — ตรงกับ default ของคอลัมน์ */
export const DEFAULT_BRANCH_CODE: BranchCode = "headquarters";

export function isBranchCode(value: string): value is BranchCode {
  return (BRANCH_CODES as readonly string[]).includes(value);
}

export function toBranchCode(value: string): BranchCode {
  return isBranchCode(value) ? value : DEFAULT_BRANCH_CODE;
}

const saleGroupLabelsTh: Record<SaleGroupCode, string> = {
  headquarters: "สาขาสำนักงานใหญ่",
  thalang: "สาขาถลาง",
  factory: "สาขาโรงงาน",
};

/**
 * ป้ายภาษาไทยสำหรับหลังบ้านและข้อความที่ส่งเข้ากลุ่ม LINE ซึ่งเป็นภาษาไทยล้วน
 * ฝั่งเว็บสาธารณะยังใช้ next-intl (`QuoteForm.contactBranch*`) ตามเดิม
 */
export function branchLabelTh(code: string): string {
  return saleGroupLabelsTh[toBranchCode(code)];
}

/** ป้ายภาษาไทยของกลุ่มปลายทาง ครอบสาขาโรงงานที่ลูกค้าเลือกเองไม่ได้ด้วย */
export function saleGroupLabelTh(code: SaleGroupCode): string {
  return saleGroupLabelsTh[code];
}
