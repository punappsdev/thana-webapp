import "server-only";

import { startOfThaiMonth } from "@/lib/line/quota";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * สถิติการแจ้งเตือนเข้ากลุ่ม LINE ฝั่งเรา อ่านจาก QuotationRequest โดยตรง
 *
 * นับเป็น **จำนวนใบเสนอราคา** ไม่ใช่จำนวนข้อความ — หนึ่งใบส่งได้หลายข้อความ
 * (ดู MAX_MESSAGES_PER_PUSH ใน lib/line/client.ts) ตัวเลขนี้จึงไม่มีทางตรงกับ
 * totalUsage ที่ LINE รายงาน และมีไว้ตอบว่า "ระบบเราส่งอะไรออกไปบ้าง"
 * ไม่ใช่ตอบว่า "โควต้าถูกใช้ไปเท่าไร"
 */
export type LineSendStats = {
  sentThisMonth: number;
  failedThisMonth: number;
  lastSentAt: Date | null;
};

export async function getLineSendStats(): Promise<LineSendStats> {
  await requireAdmin();
  const monthStart = startOfThaiMonth();
  const prisma = getPrisma();

  const [sentThisMonth, failedThisMonth, latest] = await Promise.all([
    prisma.quotationRequest.count({ where: { lineNotifiedAt: { gte: monthStart } } }),
    prisma.quotationRequest.count({
      where: {
        createdAt: { gte: monthStart },
        // เคยพยายามส่งแล้วแต่ไม่มีเวลาส่งสำเร็จ = ยังไม่ถึงกลุ่ม
        // แยกจากใบที่ lineNotifyCount = 0 ซึ่งคือ "ยังไม่เคยพยายามส่ง" ไม่ใช่ความล้มเหลว
        lineNotifiedAt: null,
        lineNotifyCount: { gt: 0 },
      },
    }),
    prisma.quotationRequest.findFirst({
      where: { lineNotifiedAt: { not: null } },
      orderBy: { lineNotifiedAt: "desc" },
      select: { lineNotifiedAt: true },
    }),
  ]);

  return { sentThisMonth, failedThisMonth, lastSentAt: latest?.lineNotifiedAt ?? null };
}
