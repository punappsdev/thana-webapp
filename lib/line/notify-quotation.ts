import "server-only";

import { getLineRoutingConfig } from "@/lib/admin/line-routing-data";
import { getQuotationDetail } from "@/lib/admin/quotation-data";
import { getLineConfig, lineGroupEnvKey } from "@/lib/line/config";
import { MAX_MESSAGES_PER_PUSH, pushLineMessage } from "@/lib/line/client";
import { buildQuotationMessages } from "@/lib/line/message";
import { resolveSaleGroup } from "@/lib/line/routing";
import { toRoutingInput } from "@/lib/line/routing-input";
import { getPrisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

export type NotifyResult =
  /** ส่งเข้ากลุ่มสำเร็จ */
  | { status: "sent" }
  /** ยังไม่ได้ตั้งค่า LINE — ไม่ถือว่าพลาด และไม่แตะสถานะในฐานข้อมูล */
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

/**
 * แจ้งคำขอใบเสนอราคาเข้ากลุ่ม LINE ของสาขาที่ลูกค้าเลือก แล้วบันทึกผลลงแถวนั้น
 *
 * อ่านข้อมูลกลับจากฐานข้อมูลแทนการรับ payload จากผู้เรียก เพื่อให้เส้นทาง "ส่ง
 * อัตโนมัติตอนลูกค้ากดส่ง" กับ "กดส่งซ้ำจากหลังบ้าน" ใช้โค้ดชุดเดียวกันเป๊ะ และ
 * ข้อความที่ส่งสะท้อนสิ่งที่บันทึกไว้จริงเสมอ
 *
 * นี่คือที่เดียวที่เขียน `responsibleBranch` ลงฐานข้อมูล — การกดส่งซ้ำหลังแก้กฎในหน้า
 * `/admin/settings/line-routing` จึงย้ายใบไปอยู่ใต้สาขาใหม่ตามกลุ่มที่ได้รับจริง
 */
export async function notifyQuotationToLine(requestId: number): Promise<NotifyResult> {
  const [request, routingConfig] = await Promise.all([
    getQuotationDetail(requestId),
    getLineRoutingConfig(),
  ]);
  if (!request) return { status: "failed", error: "ไม่พบคำขอใบเสนอราคานี้" };

  const decision = resolveSaleGroup(toRoutingInput(request), routingConfig);

  // บันทึกสาขาที่รับผิดชอบก่อนพยายามส่ง และก่อนเช็กการตั้งค่า LINE ด้วย เพราะ
  // ตัวกรองในหลังบ้านต้องใช้ค่านี้แม้ในระบบที่ยังไม่ได้ต่อ LINE และเพราะที่อยู่
  // จัดส่งซึ่งใช้ตัดสินจะถูกงาน retention ลบทิ้งในภายหลัง (ดู lib/admin/retention.ts)
  if (request.responsibleBranch !== decision.group) {
    await getPrisma().quotationRequest.update({
      where: { id: requestId },
      data: { responsibleBranch: decision.group },
    });
  }

  const config = getLineConfig();
  if (!config) {
    // ไม่เขียน lineNotifyError เพราะนี่คือ "ยังไม่ได้ตั้งค่า" ไม่ใช่ "ส่งแล้วพลาด"
    console.warn("[line] ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN หรือ LINE_GROUP_ID_* ข้ามการแจ้งเตือน");
    return { status: "skipped", reason: "ยังไม่ได้ตั้งค่าการเชื่อมต่อ LINE" };
  }

  const groupId = config.groupIds[decision.group];
  if (!groupId) {
    const message = `ยังไม่ได้ตั้งค่า ${lineGroupEnvKey(decision.group)} สำหรับสาขานี้`;
    console.warn(`[line] ${message}`);
    return { status: "skipped", reason: message };
  }

  const messages = buildQuotationMessages({
    ...request,
    saleGroup: decision.group,
    routingReason: decision.reason,
    boqDownloadUrl: request.boqDownloadToken
      ? `${SITE_URL}/api/quotation-attachments/${request.boqDownloadToken}`
      : null,
  });
  const result = await pushInBatches(config.accessToken, groupId, messages);

  await getPrisma().quotationRequest.update({
    where: { id: requestId },
    data: {
      lineNotifiedAt: result.ok ? new Date() : undefined,
      lineNotifyError: result.ok ? null : result.error,
      lineNotifyCount: { increment: 1 },
    },
  });

  if (!result.ok) {
    console.error(
      `[line] แจ้งเตือน ${request.code} เข้ากลุ่มสาขา ${decision.group} ไม่สำเร็จ:`,
      result.error,
    );
    return { status: "failed", error: result.error };
  }
  return { status: "sent" };
}

/**
 * คำขอที่มีรายการเยอะถูกแบ่งเป็นหลายข้อความ ซึ่งอาจเกิน 5 ข้อความต่อหนึ่ง push
 * จึงต้องยิงเป็นชุด ๆ ตามลำดับ ชุดแรกพลาดก็หยุดทันทีเพื่อไม่ให้กลุ่มได้การ์ดครึ่ง ๆ
 * กลาง ๆ แล้วให้ทีมงานกดส่งซ้ำทั้งใบแทน
 */
async function pushInBatches(
  accessToken: string,
  to: string,
  messages: ReturnType<typeof buildQuotationMessages>,
) {
  for (let index = 0; index < messages.length; index += MAX_MESSAGES_PER_PUSH) {
    const batch = messages.slice(index, index + MAX_MESSAGES_PER_PUSH);
    const result = await pushLineMessage({ accessToken, to, messages: batch });
    if (!result.ok) return result;
  }
  return { ok: true } as const;
}
