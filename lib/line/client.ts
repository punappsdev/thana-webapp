import "server-only";

import { randomUUID } from "node:crypto";
import type { LineQuotaRaw } from "@/lib/line/quota";
import type { FlexMessage } from "@/lib/line/message";

const PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

const QUOTA_ENDPOINT = "https://api.line.me/v2/bot/message/quota";
const QUOTA_CONSUMPTION_ENDPOINT = "https://api.line.me/v2/bot/message/quota/consumption";

/** LINE รับได้ 5 ข้อความต่อการเรียก push หนึ่งครั้ง */
export const MAX_MESSAGES_PER_PUSH = 5;

/** ตัดสั้นให้พอดีคอลัมน์ QuotationRequest.lineNotifyError (VARCHAR(500)) */
const ERROR_LIMIT = 500;

const REQUEST_TIMEOUT_MS = 10_000;

export type PushResult = { ok: true } | { ok: false; error: string };

/**
 * ยิง push message เข้ากลุ่ม LINE
 *
 * ฟังก์ชันนี้ **ไม่ throw** — คืน `{ ok: false, error }` แทน เพราะผู้เรียกคือ
 * side effect ของการรับใบเสนอราคา ที่ล้มเหลวได้โดยไม่ทำให้คำขอของลูกค้าเสีย
 * ข้อความ error ถูกตัดให้พอดีคอลัมน์ที่เก็บ และไม่มีทางมี access token ปนไป
 * เพราะ token อยู่แค่ใน header ที่เราไม่เคย serialize ออกมา
 */
export async function pushLineMessage(args: {
  accessToken: string;
  to: string;
  messages: FlexMessage[];
}): Promise<PushResult> {
  if (args.messages.length === 0) return { ok: true };
  if (args.messages.length > MAX_MESSAGES_PER_PUSH) {
    return { ok: false, error: `ส่งได้ครั้งละไม่เกิน ${MAX_MESSAGES_PER_PUSH} ข้อความ` };
  }

  try {
    const response = await fetch(PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        "Content-Type": "application/json",
        // ให้ LINE กันข้อความซ้ำเองเมื่อเรายิงซ้ำจากการ retry ของชั้นเครือข่าย
        "X-Line-Retry-Key": randomUUID(),
      },
      body: JSON.stringify({ to: args.to, messages: args.messages }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      // การแจ้งเตือนต้องออกไปทุกครั้ง ห้ามให้ Next แคช POST ปลายทางนี้
      cache: "no-store",
    });

    if (response.ok) return { ok: true };

    // LINE ตอบรายละเอียดความผิดพลาดมาเป็น JSON เก็บดิบไว้ให้ทีมงานอ่านวินิจฉัยได้
    const detail = (await response.text().catch(() => "")).trim();
    return {
      ok: false,
      error: `LINE ตอบกลับ ${response.status}${detail ? `: ${detail}` : ""}`.slice(0, ERROR_LIMIT),
    };
  } catch (error) {
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return { ok: false, error: `เรียก LINE API ไม่สำเร็จ — ${reason}`.slice(0, ERROR_LIMIT) };
  }
}

export type QuotaResult = { ok: true; quota: LineQuotaRaw } | { ok: false; error: string };

/** แปลง status ที่ LINE ตอบกลับเป็นข้อความที่ทีมงานอ่านแล้วรู้ว่าต้องไปแก้อะไร */
function describeLineStatus(status: number, detail: string): string {
  if (status === 401 || status === 403) {
    return "LINE ปฏิเสธ access token — ตรวจสอบว่า LINE_CHANNEL_ACCESS_TOKEN ถูกต้องและยังไม่หมดอายุ";
  }
  // endpoint โควต้าจำกัดที่ราว 100 ครั้งต่อชั่วโมง กดรีเฟรชรัวเกินไปจะเจอเคสนี้
  if (status === 429) return "เรียก LINE API ถี่เกินไป กรุณารอสักครู่แล้วลองใหม่";
  return `LINE ตอบกลับ ${status}${detail ? `: ${detail}` : ""}`;
}

/** GET แล้ว parse JSON โดยไม่ throw — คืน error เป็นข้อความไทยพร้อมแสดงผล */
async function getLineJson<T>(
  endpoint: string,
  accessToken: string,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    // ตัวเลขโควต้าต้องสดเสมอ โดยเฉพาะตอนทีมงานกดรีเฟรชเพื่อเช็กหลังส่งข้อความ
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).trim();
    return { ok: false, error: describeLineStatus(response.status, detail) };
  }

  return { ok: true, data: (await response.json()) as T };
}

/**
 * อ่านโควต้าข้อความรายเดือนของ LINE Official Account
 *
 * ต้องยิงสอง endpoint เพราะ LINE แยกเพดานโควต้าออกจากยอดที่ใช้ไปแล้ว
 * ฟังก์ชันนี้ **ไม่ throw** เช่นเดียวกับ `pushLineMessage` — หน้าหลังบ้านที่เรียกใช้
 * ต้องยังแสดงผลได้แม้ LINE ล่ม และข้อความ error ไม่มีทางมี token ปนไปเพราะ token
 * อยู่แค่ใน header ที่เราไม่เคย serialize ออกมา
 */
export async function fetchLineMessageQuota(accessToken: string): Promise<QuotaResult> {
  try {
    const [quota, consumption] = await Promise.all([
      getLineJson<{ type: string; value?: number }>(QUOTA_ENDPOINT, accessToken),
      getLineJson<{ totalUsage: number }>(QUOTA_CONSUMPTION_ENDPOINT, accessToken),
    ]);

    if (!quota.ok) return { ok: false, error: quota.error.slice(0, ERROR_LIMIT) };
    if (!consumption.ok) return { ok: false, error: consumption.error.slice(0, ERROR_LIMIT) };

    return {
      ok: true,
      quota: {
        // LINE ตอบ "limited" หรือ "none" อย่างอื่นถือว่าจำกัดไว้ก่อนเพื่อไม่ให้เผลอ
        // แสดงว่า "ไม่จำกัด" ทั้งที่จริงมีเพดาน
        type: quota.data.type === "none" ? "none" : "limited",
        value: quota.data.value,
        totalUsage: consumption.data.totalUsage,
      },
    };
  } catch (error) {
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return { ok: false, error: `อ่านโควต้าจาก LINE ไม่สำเร็จ — ${reason}`.slice(0, ERROR_LIMIT) };
  }
}
