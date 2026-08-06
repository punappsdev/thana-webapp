import "dotenv/config";
import { getLineRoutingConfig } from "../lib/line/routing-config";
import { resolveSaleGroup } from "../lib/line/routing";
import { toRoutingInput } from "../lib/line/routing-input";
import { getPrisma } from "../lib/prisma";

/**
 * เติม `QuotationRequest.responsibleBranch` ให้คำขอที่ส่งเข้ามาก่อนจะมีคอลัมน์นี้
 *
 * รันครั้งเดียวหลัง migration `20260806100000_add_quotation_responsible_branch`
 * คำขอใหม่ได้ค่านี้เองตอน `lib/line/notify-quotation.ts` เลือกกลุ่มปลายทาง
 *
 *   npx tsx scripts/backfill-quotation-responsible-branch.ts --dry-run
 *   npx tsx scripts/backfill-quotation-responsible-branch.ts
 *
 * ข้อจำกัดที่ต้องรู้: สคริปต์คำนวณด้วย **กฎที่ตั้งไว้ ณ วันนี้** ใบเก่าที่เคยถูกส่ง
 * เข้ากลุ่มอื่นตามกฎเดิมจึงอาจได้สาขาไม่ตรงกับที่ได้รับใบไปจริง และใบที่งาน
 * retention ลบที่อยู่จัดส่งไปแล้ว (`anonymizedAt` ไม่ว่าง) จะคำนวณออกมาเป็นสาขา
 * ถลางตามกฎข้อสุดท้ายเสมอ จึงถูกข้ามโดยปริยาย — ใช้ `--include-anonymized`
 * ถ้ายอมรับค่าที่เดาไม่ได้นั้น
 */
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const includeAnonymized = process.argv.includes("--include-anonymized");
  const prisma = getPrisma();

  const config = await getLineRoutingConfig();
  const pending = await prisma.quotationRequest.findMany({
    where: {
      responsibleBranch: null,
      ...(includeAnonymized ? {} : { anonymizedAt: null }),
    },
    orderBy: { id: "asc" },
    select: {
      id: true,
      code: true,
      needDelivery: true,
      contactBranch: true,
      deliveryProvince: true,
      deliveryDistrict: true,
      items: { select: { product: { select: { id: true, categoryId: true, subCategoryId: true } } } },
    },
  });

  console.log(
    `[backfill] ${dryRun ? "DRY RUN — ไม่เขียนอะไรทั้งสิ้น" : "เริ่มเติมสาขาที่รับผิดชอบ"} · พบ ${pending.length} ใบที่ยังไม่มีค่า`,
  );

  const counts = new Map<string, number>();
  for (const request of pending) {
    const decision = resolveSaleGroup(toRoutingInput(request), config);
    counts.set(decision.group, (counts.get(decision.group) ?? 0) + 1);
    if (!dryRun) {
      await prisma.quotationRequest.update({
        where: { id: request.id },
        data: { responsibleBranch: decision.group },
      });
    }
  }

  for (const [group, count] of counts) {
    console.log(`[backfill] ${group}: ${count} ใบ`);
  }
  if (dryRun) console.log("[backfill] DRY RUN จบแล้ว ยังไม่มีข้อมูลใดถูกแก้");
}

main()
  .catch((error) => {
    console.error("[backfill] ล้มเหลว:", error);
    process.exitCode = 1;
  })
  .finally(async () => getPrisma().$disconnect());
