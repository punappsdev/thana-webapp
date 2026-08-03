import "server-only";

import { randomUUID } from "node:crypto";
import type { FlexMessage } from "@/lib/line/message";

const PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

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
