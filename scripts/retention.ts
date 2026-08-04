import "dotenv/config";
import {
  ACTIVITY_LOG_RETENTION_DAYS,
  LOGIN_ATTEMPT_RETENTION_DAYS,
  QUOTATION_RETENTION_YEARS,
  quotationCutoff,
  runRetention,
} from "../lib/admin/retention";
import { getPrisma } from "../lib/prisma";

/**
 * งานลบข้อมูลที่พ้นกำหนดเก็บ ตั้งให้ cron ของระบบเรียกสัปดาห์ละครั้ง (ดู docs/ADMIN.md)
 *
 * รันด้วย --dry-run ก่อนเสมอในครั้งแรกของแต่ละเซิร์ฟเวอร์ เพื่อดูว่าจะมีอะไรหายไปบ้าง
 */
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const now = new Date();
  const cutoff = quotationCutoff(now);

  console.log(
    `[retention] ${dryRun ? "DRY RUN — ไม่เขียนอะไรทั้งสิ้น" : "เริ่มลบข้อมูลที่พ้นกำหนด"}`,
  );
  console.log(
    `[retention] เกณฑ์: ใบเสนอราคาที่สร้างก่อน ${cutoff.toISOString()} (${QUOTATION_RETENTION_YEARS} ปี)`,
  );

  const summary = await runRetention({ now, dryRun });

  console.log(
    [
      `[retention] ใบเสนอราคาที่ถึงกำหนด ${summary.quotationsFound} ใบ`,
      `ลบข้อมูลส่วนบุคคลแล้ว ${summary.quotationsAnonymized} ใบ`,
      `ไฟล์ BOQ ที่ลบ ${summary.boqFilesDeleted} ไฟล์`,
      `ไฟล์ที่หายไปก่อนแล้ว ${summary.boqFilesMissing} ไฟล์`,
    ].join(" · "),
  );
  console.log(
    [
      `[retention] เซสชันแอดมินหมดอายุ ${summary.sessionsPruned} รายการ`,
      `ประวัติล็อกอิน (เกิน ${LOGIN_ATTEMPT_RETENTION_DAYS} วัน) ${summary.loginAttemptsPruned} รายการ`,
      `log กิจกรรม (เกิน ${ACTIVITY_LOG_RETENTION_DAYS} วัน) ${summary.activityLogsPruned} รายการ`,
    ].join(" · "),
  );

  if (dryRun) {
    console.log("[retention] DRY RUN จบแล้ว ยังไม่มีข้อมูลใดถูกลบ");
  }
}

main()
  .catch((error) => {
    console.error("[retention] ล้มเหลว:", error);
    process.exitCode = 1;
  })
  .finally(async () => getPrisma().$disconnect());
