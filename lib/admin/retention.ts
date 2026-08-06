import fs from "node:fs/promises";
import { resolveUploadPath } from "@/lib/admin/security";
import { getPrisma } from "@/lib/prisma";

/**
 * การลบข้อมูลตามกำหนดเวลาของนโยบายความเป็นส่วนตัว (Legal.privacy ใน messages/*.json)
 *
 * โมดูลนี้ตั้งใจไม่ import "server-only" เพราะถูกเรียกจาก scripts/retention.ts ผ่าน tsx
 * ซึ่งอยู่นอก Next runtime และแพ็กเกจ server-only จะโยน error ทันทีที่ถูก import
 * ด้วยเหตุผลเดียวกันจึงลบไฟล์ด้วย fs.unlink ตรง ๆ แทนที่จะเรียก removeStoredBoqFile
 * จาก lib/quotation-boq.ts ที่ติด server-only ไว้
 */

/** นโยบายกำหนดให้เก็บข้อมูลผู้ขอใบเสนอราคาที่ไม่ได้ตกลงซื้อไว้ 3 ปี */
export const QUOTATION_RETENTION_YEARS = 3;

/** ผู้ที่ตกลงซื้อจริงเก็บได้ 10 ปี ทีมงานกดยืนยันเองผ่านหน้าแอดมิน */
export const CUSTOMER_RETENTION_YEARS = 10;

/** log กิจกรรมของแอดมินมีไว้สอบย้อนหลัง สองปีครอบคลุมรอบตรวจสอบภายในแล้ว */
export const ACTIVITY_LOG_RETENTION_DAYS = 730;

/** ประวัติการล็อกอินผิดใช้แค่หน่วงการเดารหัสผ่านในกรอบ 15 นาที */
export const LOGIN_ATTEMPT_RETENTION_DAYS = 30;

/** จำนวนแถวต่อรอบ กันไม่ให้ update ก้อนเดียวยาวจนล็อกตารางนาน */
const BATCH_SIZE = 200;

export function subtractYears(from: Date, years: number): Date {
  const result = new Date(from);
  result.setFullYear(result.getFullYear() - years);
  return result;
}

export function subtractDays(from: Date, days: number): Date {
  return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
}

/** คำขอที่สร้างก่อนเวลานี้ถือว่าพ้นกำหนดเก็บแล้ว */
export function quotationCutoff(now: Date): Date {
  return subtractYears(now, QUOTATION_RETENTION_YEARS);
}

/** วันที่ครบกำหนดเก็บสำหรับคำขอที่ทีมงานยืนยันว่ากลายเป็นออเดอร์จริง */
export function customerRetainUntil(createdAt: Date): Date {
  const result = new Date(createdAt);
  result.setFullYear(result.getFullYear() + CUSTOMER_RETENTION_YEARS);
  return result;
}

/** วันที่คำขอใบหนึ่งจะถูกลบข้อมูล ใช้บอกทีมงานในหน้ารายละเอียด */
export function quotationDeleteAt(createdAt: Date): Date {
  const result = new Date(createdAt);
  result.setFullYear(result.getFullYear() + QUOTATION_RETENTION_YEARS);
  return result;
}

/**
 * ค่าที่เขียนทับข้อมูลส่วนบุคคลทุกคอลัมน์
 *
 * firstName/lastName/phone เป็น NOT NULL จึงเขียนทับด้วยข้อความบอกสถานะและสตริงว่าง
 * แทนที่จะใส่ค่าที่ดูเหมือนชื่อจริง ส่วน boqDownloadToken ต้องถูกล้างด้วยเพราะลิงก์
 * ดาวน์โหลดที่เคยส่งเข้ากลุ่ม LINE จะค้างอยู่ในแชทตลอดไปและไม่มีวันหมดอายุเอง
 *
 * สิ่งที่เก็บไว้: code, createdAt, consentAt, contactBranch, responsibleBranch, locale, รหัส
 * จังหวัด และ QuotationItem ทั้งหมด — ไม่ระบุตัวบุคคลแต่ยังใช้ดูสถิติสินค้าที่ถูกขอ
 * ราคาได้ และยังกรองตามสาขาที่รับผิดชอบได้ (ที่อยู่จัดส่งที่ใช้ตัดสินสาขาถูกลบไป
 * แล้ว จึงคำนวณซ้ำไม่ได้ ต้องอาศัยค่าที่บันทึกไว้ตอนแจ้งเข้ากลุ่ม LINE)
 */
export function anonymizedQuotationFields(now: Date) {
  return {
    firstName: "ลบข้อมูลตามนโยบายแล้ว",
    lastName: "",
    phone: "",
    email: null,
    lineId: null,
    companyName: null,
    taxId: null,
    addressLine: null,
    subDistrict: null,
    district: null,
    postalCode: null,
    deliveryAddressLine: null,
    deliverySubDistrict: null,
    deliveryDistrict: null,
    deliveryPostalCode: null,
    ipAddress: null,
    userAgent: null,
    adminNote: null,
    boqStoragePath: null,
    boqOriginalName: null,
    boqMimeType: null,
    boqSize: null,
    boqDownloadToken: null,
    anonymizedAt: now,
  } as const;
}

/** เงื่อนไขเดียวที่ใช้ทั้งตอนนับ (dry run) และตอนดึงแถวมาทำจริง */
export function expiredQuotationWhere(now: Date) {
  return {
    anonymizedAt: null,
    createdAt: { lt: quotationCutoff(now) },
    OR: [{ retainUntil: null }, { retainUntil: { lt: now } }],
  };
}

export type RetentionSummary = {
  quotationsFound: number;
  quotationsAnonymized: number;
  boqFilesDeleted: number;
  boqFilesMissing: number;
  sessionsPruned: number;
  loginAttemptsPruned: number;
  activityLogsPruned: number;
};

/**
 * ลบไฟล์ BOQ แล้ว anonymize แถวที่พ้นกำหนด และเก็บกวาดตารางที่โตไม่มีเพดาน
 *
 * ลำดับ "ลบไฟล์ก่อน แล้วค่อยล้างแถว" ตั้งใจให้ล้มเหลวไปทางที่ปลอดภัย: ถ้าโปรเซสตาย
 * กลางทางจะเหลือไฟล์กำพร้าที่ scripts/sweep-uploads.ts เก็บให้ทีหลัง ซึ่งดีกว่าการ
 * ล้างแถวก่อนแล้วเหลือไฟล์ที่ไม่มีใครรู้ว่ามาจากไหน
 *
 * งานนี้ idempotent — anonymizedAt เป็นตัวกันการทำซ้ำ รันกี่รอบก็ได้ผลเท่าเดิม
 */
export async function runRetention({
  now = new Date(),
  dryRun = false,
}: { now?: Date; dryRun?: boolean } = {}): Promise<RetentionSummary> {
  const prisma = getPrisma();
  const uploadDir = process.env.UPLOAD_DIR;
  if (!uploadDir) throw new Error("UPLOAD_DIR is not configured");

  const where = expiredQuotationWhere(now);
  const summary: RetentionSummary = {
    quotationsFound: await prisma.quotationRequest.count({ where }),
    quotationsAnonymized: 0,
    boqFilesDeleted: 0,
    boqFilesMissing: 0,
    sessionsPruned: 0,
    loginAttemptsPruned: 0,
    activityLogsPruned: 0,
  };

  if (!dryRun) {
    // ไม่ใช้ skip/take เพราะแถวที่ทำเสร็จจะหลุดออกจากเงื่อนไขทันที การอ่านหน้าแรกซ้ำ
    // จึงได้แถวที่ยังไม่ถูกทำเสมอ และวนจนกว่าจะไม่เหลือ
    for (;;) {
      const batch = await prisma.quotationRequest.findMany({
        where,
        select: { id: true, boqStoragePath: true },
        orderBy: { id: "asc" },
        take: BATCH_SIZE,
      });
      if (batch.length === 0) break;

      for (const row of batch) {
        if (!row.boqStoragePath) continue;
        const removed = await removeQuietly(
          resolveUploadPath(uploadDir, row.boqStoragePath),
        );
        if (removed) summary.boqFilesDeleted += 1;
        else summary.boqFilesMissing += 1;
      }

      const result = await prisma.quotationRequest.updateMany({
        where: { id: { in: batch.map((row) => row.id) } },
        data: anonymizedQuotationFields(now),
      });
      summary.quotationsAnonymized += result.count;
    }
  }

  const sessionWhere = { expiresAt: { lt: now } };
  const loginWhere = { createdAt: { lt: subtractDays(now, LOGIN_ATTEMPT_RETENTION_DAYS) } };
  const activityWhere = { createdAt: { lt: subtractDays(now, ACTIVITY_LOG_RETENTION_DAYS) } };

  if (dryRun) {
    summary.sessionsPruned = await prisma.adminSession.count({ where: sessionWhere });
    summary.loginAttemptsPruned = await prisma.adminLoginAttempt.count({ where: loginWhere });
    summary.activityLogsPruned = await prisma.activityLog.count({ where: activityWhere });
  } else {
    summary.sessionsPruned = (await prisma.adminSession.deleteMany({ where: sessionWhere })).count;
    summary.loginAttemptsPruned = (
      await prisma.adminLoginAttempt.deleteMany({ where: loginWhere })
    ).count;
    summary.activityLogsPruned = (
      await prisma.activityLog.deleteMany({ where: activityWhere })
    ).count;
  }

  return summary;
}

/** คืน true เมื่อลบไฟล์ได้จริง, false เมื่อไฟล์หายไปก่อนแล้ว, และโยนต่อเมื่อพังจริง */
async function removeQuietly(absolutePath: string): Promise<boolean> {
  try {
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}
