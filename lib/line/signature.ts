import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * ตรวจลายเซ็น `x-line-signature` ของ webhook จาก LINE
 *
 * LINE เซ็น **raw request body** ด้วย HMAC-SHA256 โดยใช้ channel secret แล้วส่งมา
 * เป็น base64 ดังนั้นฝั่งเราต้องอ่าน body เป็น text ก่อน parse JSON ไม่งั้นการ
 * serialize กลับจะได้ไบต์คนละชุดกับที่ถูกเซ็น
 *
 * แยกออกมาเป็นฟังก์ชันบริสุทธิ์เพื่อให้เทสต์ได้ ตามคู่ auth.ts / auth-policy.ts
 */
export function isValidLineSignature(
  body: string,
  signature: string | null | undefined,
  channelSecret: string,
): boolean {
  if (!signature || !channelSecret) return false;

  const expected = createHmac("sha256", channelSecret).update(body, "utf8").digest();

  let received: Buffer;
  try {
    received = Buffer.from(signature, "base64");
  } catch {
    return false;
  }

  // timingSafeEqual โยน error ถ้าความยาวไม่เท่ากัน ต้องกันไว้ก่อนเสมอ
  // ความยาวไม่ใช่ความลับ การเทียบตรงนี้จึงไม่รั่วอะไร
  if (received.length !== expected.length) return false;

  return timingSafeEqual(received, expected);
}
