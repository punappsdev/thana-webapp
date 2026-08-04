/**
 * คำนวณสรุปโควต้าข้อความ LINE จากค่าดิบที่ API ตอบกลับ
 *
 * แยกเป็นโมดูลบริสุทธิ์แบบเดียวกับ `lib/line/routing.ts` เพราะเกณฑ์ "ใกล้หมด"
 * เป็นข้อตกลงที่ปรับได้ และต้องทดสอบได้โดยไม่ต้อง mock fetch หรือมี token จริง
 */

/** ค่าดิบที่รวมมาจาก /v2/bot/message/quota และ /quota/consumption */
export type LineQuotaRaw = {
  /** "none" = แพ็กเกจไม่จำกัดโควต้า จะไม่มี value ส่งมาด้วย */
  type: "limited" | "none";
  value?: number;
  totalUsage: number;
};

/** ระดับความเร่งด่วน ใช้เลือกสี Badge ในหน้าหลังบ้าน */
export type LineQuotaLevel = "ok" | "warning" | "critical";

export type LineQuotaSummary = {
  unlimited: boolean;
  /** null เมื่อไม่จำกัดโควต้า */
  limit: number | null;
  used: number;
  /** null เมื่อไม่จำกัดโควต้า ไม่ต่ำกว่า 0 เสมอ */
  remaining: number | null;
  /** 0–100 ปัดเป็นจำนวนเต็ม เป็น 0 เมื่อไม่จำกัดโควต้า */
  usedPercent: number;
  level: LineQuotaLevel;
};

/** ใช้เกิน 80% ถือว่าควรเริ่มเฝ้าดู */
const WARNING_PERCENT = 80;

/** ใช้เกิน 95% ถือว่าเสี่ยงส่งไม่ออกภายในเดือนนี้ */
const CRITICAL_PERCENT = 95;

export function summarizeLineQuota(raw: LineQuotaRaw): LineQuotaSummary {
  const used = Math.max(0, Math.trunc(raw.totalUsage) || 0);

  // value หายไปทั้งที่ type เป็น limited ไม่ควรเกิด แต่ถ้าเกิดก็ต้องไม่พังทั้งการ์ด
  // จึงถือว่าอ่านเพดานไม่ได้ = ปฏิบัติเหมือนไม่จำกัด แล้วโชว์แค่ยอดที่ใช้ไป
  const limit = raw.type === "limited" && typeof raw.value === "number" ? Math.max(0, Math.trunc(raw.value)) : null;

  if (limit === null) {
    return { unlimited: true, limit: null, used, remaining: null, usedPercent: 0, level: "ok" };
  }

  // โควต้า 0 คือส่งไม่ได้เลย ให้เป็น 100% ตรง ๆ แทนการหารด้วยศูนย์
  const usedPercent = limit === 0 ? 100 : Math.min(100, Math.round((used / limit) * 100));
  const remaining = Math.max(0, limit - used);

  let level: LineQuotaLevel = "ok";
  if (usedPercent >= CRITICAL_PERCENT || remaining === 0) level = "critical";
  else if (usedPercent >= WARNING_PERCENT) level = "warning";

  return { unlimited: false, limit, used, remaining, usedPercent, level };
}

/**
 * ไทยอยู่ที่ UTC+7 คงที่ ไม่เคยมี daylight saving จึงบวกออฟเซ็ตตรง ๆ ได้
 * โดยไม่ต้องพึ่ง timezone ของเครื่องที่รัน ซึ่งบน server อาจเป็น UTC
 */
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * ต้นเดือนปัจจุบันตามเวลาไทย คืนเป็น Date ที่เทียบกับคอลัมน์ DateTime ได้ตรง ๆ
 *
 * ใช้เทียบกรอบเวลากับโควต้าของ LINE ที่รีเซ็ตรายเดือน — รอบของ LINE ไม่จำเป็นต้อง
 * ตรงกับรอบนี้เป๊ะ ตัวเลขสองฝั่งจึงคลาดกันได้ช่วงต้นเดือน
 */
export function startOfThaiMonth(now: Date = new Date()): Date {
  const bangkok = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  return new Date(Date.UTC(bangkok.getUTCFullYear(), bangkok.getUTCMonth(), 1) - BANGKOK_OFFSET_MS);
}
