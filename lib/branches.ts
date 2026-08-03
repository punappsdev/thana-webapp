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

/** สาขาที่ใช้เมื่อค่าในฐานข้อมูลอ่านไม่ออก — ตรงกับ default ของคอลัมน์ */
export const DEFAULT_BRANCH_CODE: BranchCode = "headquarters";

export function isBranchCode(value: string): value is BranchCode {
  return (BRANCH_CODES as readonly string[]).includes(value);
}

export function toBranchCode(value: string): BranchCode {
  return isBranchCode(value) ? value : DEFAULT_BRANCH_CODE;
}

const branchLabelsTh: Record<BranchCode, string> = {
  headquarters: "สาขาสำนักงานใหญ่",
  thalang: "สาขาถลาง",
};

/**
 * ป้ายภาษาไทยสำหรับหลังบ้านและข้อความที่ส่งเข้ากลุ่ม LINE ซึ่งเป็นภาษาไทยล้วน
 * ฝั่งเว็บสาธารณะยังใช้ next-intl (`QuoteForm.contactBranch*`) ตามเดิม
 */
export function branchLabelTh(code: string): string {
  return branchLabelsTh[toBranchCode(code)];
}
