/**
 * ประเภทลูกค้าที่ลูกค้าเลือกในฟอร์มขอใบเสนอราคา (/quote)
 *
 * ตัวโค้ดถูกเก็บลง `QuotationRequest.customerType` เป็น VARCHAR ไม่ใช่ enum ของ
 * ฐานข้อมูล ด้วยเหตุผลเดียวกับ `contactBranch` — คำขอเก่าก่อนมีคอลัมน์นี้จึงมีค่า
 * null ได้ ทุกฟังก์ชันด้านล่างจึงรับ `string | null` และเผื่อทางออกไว้เสมอ
 *
 * ฝั่งเว็บสาธารณะใช้ next-intl (`QuoteForm.customerType*`) เพราะต้องเป็นสองภาษา
 * ฟังก์ชัน `customerTypeLabelTh` ไว้ใช้เฉพาะหลังบ้านที่เป็นภาษาไทยล้วน
 */
export const CUSTOMER_TYPE_CODES = ["project", "contractor", "homeowner", "corporate"] as const;

export type CustomerType = (typeof CUSTOMER_TYPE_CODES)[number];

export function isCustomerTypeCode(value: string): value is CustomerType {
  return (CUSTOMER_TYPE_CODES as readonly string[]).includes(value);
}

const customerTypeLabelsTh: Record<CustomerType, string> = {
  project: "ลูกค้าโครงการ",
  contractor: "ช่าง / ผู้รับเหมา",
  homeowner: "เจ้าของบ้าน",
  corporate: "ลูกค้ากลุ่มบริษัท",
};

/**
 * ป้ายภาษาไทยสำหรับหลังบ้าน (หน้ารวมและหน้า detail ของใบเสนอราคา)
 * คำขอเก่าที่ไม่มีค่าแสดงเป็น "—"
 */
export function customerTypeLabelTh(code: string | null): string {
  if (code === null || !isCustomerTypeCode(code)) return "—";
  return customerTypeLabelsTh[code];
}
