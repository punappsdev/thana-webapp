/**
 * ตัวกรอง "สาขา" และ "เดือนที่ส่ง" ของหน้ารวมใบเสนอราคาในหลังบ้าน
 *
 * แยกออกมาเป็นโมดูลบริสุทธิ์ (ไม่มี `server-only`) เพราะเป็นตรรกะแปลงค่าจาก
 * query string เป็นเงื่อนไข Prisma ซึ่งทดสอบได้โดยไม่ต้องมีฐานข้อมูล แนวเดียวกับ
 * `lib/admin/retention.ts`
 */
import { SALE_GROUP_CODES, saleGroupLabelTh, type SaleGroupCode } from "@/lib/branches";

/** ค่าที่แปลว่า "ไม่กรอง" ใช้เป็น value ของ SelectItem ซึ่งเป็นสตริงว่างไม่ได้ */
export const ALL_FILTER_VALUE = "all";

/** ใบที่ยังไม่มี `responsibleBranch` ในฐานข้อมูล */
export const UNASSIGNED_FILTER_VALUE = "unassigned";

/** ป้ายของใบที่ยังไม่ผ่านการเลือกกลุ่ม ใช้ทั้งในตัวกรองและในตาราง */
export const UNASSIGNED_BRANCH_LABEL = "ยังไม่ได้ระบุสาขา";

export function responsibleBranchOptions(): { value: string; label: string }[] {
  return [
    { value: ALL_FILTER_VALUE, label: "ทุกสาขา" },
    ...SALE_GROUP_CODES.map((code) => ({ value: code, label: saleGroupLabelTh(code) })),
    { value: UNASSIGNED_FILTER_VALUE, label: UNASSIGNED_BRANCH_LABEL },
  ];
}

function isSaleGroupCode(value: string): value is SaleGroupCode {
  return (SALE_GROUP_CODES as readonly string[]).includes(value);
}

/**
 * เงื่อนไขสาขาที่รับผิดชอบสำหรับ `where` ของ Prisma
 *
 * กรองด้วยคอลัมน์ `responsibleBranch` ที่ `lib/line/notify-quotation.ts` บันทึกไว้
 * ไม่ใช่ `contactBranch` ที่ลูกค้าเลือก เพราะคำขอแบบจัดส่งไม่มี `contactBranch`
 * (เป็น null) และสาขาที่ดูแลจริงมาจากกฎใน `lib/line/routing.ts` (อำเภอปลายทาง +
 * ชนิดสินค้า) ซึ่งคำนวณใน SQL ไม่ได้
 */
export function responsibleBranchWhere(value: string | undefined) {
  // ค่าที่อ่านไม่ออก (แก้ตรงฐานข้อมูล หรือกลุ่มที่ถูกถอดออกจากโค้ดไปแล้ว) ถูกนับ
  // รวมกับใบที่ยังไม่มีค่า ให้ตรงกับป้ายในตารางซึ่งก็อ่านว่า "ยังไม่ได้ระบุสาขา"
  // ไม่งั้นแถวพวกนี้จะไม่โผล่ใต้ตัวเลือกไหนเลย
  if (value === UNASSIGNED_FILTER_VALUE) {
    return {
      OR: [
        { responsibleBranch: null },
        { responsibleBranch: { notIn: [...SALE_GROUP_CODES] } },
      ],
    };
  }
  if (value && isSaleGroupCode(value)) return { responsibleBranch: value };
  return {};
}

/** ป้ายสาขาที่รับผิดชอบในตาราง คำขอเก่าที่ยังไม่มีค่าจะอ่านออกว่าทำไมถึงว่าง */
export function responsibleBranchLabel(branch: string | null): string {
  return branch && isSaleGroupCode(branch) ? saleGroupLabelTh(branch) : UNASSIGNED_BRANCH_LABEL;
}

/** วิธีรับสินค้า แสดงเป็นบรรทัดรองใต้ชื่อสาขาเพื่อบอกที่มาของการเลือกสาขานั้น */
export function quotationFulfillmentLabel(request: { needDelivery: boolean }): string {
  return request.needDelivery ? "จัดส่งถึงหน้างาน" : "ลูกค้ามารับเอง";
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * เดือนถูกคิดตามเวลาของเครื่องเซิร์ฟเวอร์ ไม่ใช่ UTC เพื่อให้ขอบเดือนตรงกับวันที่
 * ที่ตารางแสดงด้วย `toLocaleString("th-TH")` ซึ่งก็ใช้เวลาเครื่องเหมือนกัน
 */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** ช่วงเวลาของเดือน "YYYY-MM" คืน null เมื่อค่าที่รับมาไม่ใช่รูปแบบเดือน */
export function monthRange(value: string | undefined): { gte: Date; lt: Date } | null {
  if (!value || !MONTH_PATTERN.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  return { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) };
}

/** เงื่อนไขเดือนที่ส่งสำหรับ `where` ของ Prisma */
export function quotationMonthWhere(value: string | undefined) {
  const range = monthRange(value);
  return range ? { createdAt: range } : {};
}

/** เพดานจำนวนเดือนในดรอปดาวน์ กันข้อมูลวันที่เพี้ยนทำให้ลิสต์ยาวไม่รู้จบ */
const MAX_MONTH_OPTIONS = 240;

/** ทุกเดือนตั้งแต่ `newest` ไล่ย้อนลงถึงเดือนของ `oldest` เรียงใหม่ไปเก่า */
export function monthKeysBetween(oldest: Date, newest: Date): string[] {
  const cursor = new Date(newest.getFullYear(), newest.getMonth(), 1);
  const end = new Date(oldest.getFullYear(), oldest.getMonth(), 1);
  const keys: string[] = [];
  while (cursor >= end && keys.length < MAX_MONTH_OPTIONS) {
    keys.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return keys;
}

// th-TH ใช้ปฏิทินพุทธเป็นค่าเริ่มต้น จึงได้ "สิงหาคม 2569" โดยไม่ต้องบวกปีเอง
const monthFormatter = new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" });

export function monthLabelTh(key: string): string {
  const range = monthRange(key);
  return range ? monthFormatter.format(range.gte) : key;
}
