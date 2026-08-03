import { NextResponse } from "next/server";
import { isValidLineSignature } from "@/lib/line/signature";

/**
 * Webhook ของ LINE — มีไว้เพื่ออย่างเดียวคือ **หา Group ID ของกลุ่ม Sale**
 *
 * แอป LINE ไม่แสดง Group ID ให้เห็นที่ไหนเลย วิธีเดียวที่จะได้มาคือดักจาก event
 * ที่ LINE ยิงมาตอนบอทถูกเชิญเข้ากลุ่มหรือมีคนพิมพ์ในกลุ่ม endpoint นี้จึงแค่
 * log ค่านั้นออกมาให้เอาไปใส่ LINE_GROUP_ID_* แล้วปล่อยทิ้งไว้เฉย ๆ
 * ไม่เก็บลงฐานข้อมูล ไม่ตอบกลับข้อความ
 */
type LineWebhookEvent = {
  type?: string;
  source?: { type?: string; groupId?: string; roomId?: string; userId?: string };
};

export async function POST(request: Request) {
  // ต้องอ่านเป็น text ก่อน parse — LINE เซ็นไบต์ดิบของ body การ stringify กลับ
  // จาก object จะได้ผลลัพธ์คนละชุดและ signature จะไม่ตรง
  const body = await request.text();

  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    console.error("[line webhook] ยังไม่ได้ตั้งค่า LINE_CHANNEL_SECRET");
    return new NextResponse("Not configured", { status: 503 });
  }

  if (!isValidLineSignature(body, request.headers.get("x-line-signature"), channelSecret)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const events = (JSON.parse(body)?.events ?? []) as LineWebhookEvent[];
    for (const event of events) {
      const source = event.source ?? {};
      console.info(
        "[line webhook] event=%s source=%s groupId=%s roomId=%s userId=%s",
        event.type ?? "-",
        source.type ?? "-",
        source.groupId ?? "-",
        source.roomId ?? "-",
        source.userId ?? "-",
      );
    }
  } catch (error) {
    console.error("[line webhook] อ่าน payload ไม่สำเร็จ:", error);
  }

  // ต้องตอบ 200 เสมอแม้ payload จะอ่านไม่ออก ไม่งั้น LINE จะยิงซ้ำและขึ้นเตือนใน console
  return new NextResponse("OK", { status: 200 });
}
