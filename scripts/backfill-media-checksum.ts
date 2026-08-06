import "dotenv/config";
import { computeFileChecksum } from "../lib/admin/checksum";
import { resolveUploadPath } from "../lib/admin/security";
import { getPrisma } from "../lib/prisma";

const BATCH = 200;

/**
 * Fills MediaAsset.checksum for assets uploaded before the column existed, so the
 * duplicate warning on upload can also match against the historical library.
 * Safe to re-run: it only ever looks at rows where checksum is still null.
 */
async function main() {
  const uploadDir = process.env.UPLOAD_DIR;
  if (!uploadDir) throw new Error("UPLOAD_DIR is not configured");
  const prisma = getPrisma();

  let updated = 0;
  let missing = 0;
  for (;;) {
    const pending = await prisma.mediaAsset.findMany({
      where: { checksum: null },
      select: { id: true, path: true, originalName: true },
      orderBy: { createdAt: "asc" },
      take: BATCH,
    });
    if (!pending.length) break;

    let progressed = false;
    for (const asset of pending) {
      let checksum: string;
      try {
        checksum = await computeFileChecksum(resolveUploadPath(uploadDir, asset.path));
      } catch (error) {
        // A row whose file vanished stays null — sweep-uploads/retention own that cleanup.
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          console.warn(`ข้ามไฟล์ที่หายไปจากดิสก์: ${asset.path} (${asset.originalName})`);
          missing += 1;
          continue;
        }
        throw error;
      }
      await prisma.mediaAsset.update({ where: { id: asset.id }, data: { checksum } });
      updated += 1;
      progressed = true;
    }
    // Every row in this batch was unreadable, so the next query returns the same
    // rows forever — stop instead of looping.
    if (!progressed) break;
  }

  console.log(`คำนวณ checksum เพิ่ม ${updated} รายการ${missing ? ` (ข้ามไฟล์ที่หาย ${missing} รายการ)` : ""}`);

  const groups = await prisma.mediaAsset.groupBy({
    by: ["checksum"],
    where: { checksum: { not: null } },
    _count: { _all: true },
    having: { checksum: { _count: { gt: 1 } } },
  });
  if (!groups.length) {
    console.log("ไม่พบไฟล์ที่มีเนื้อหาซ้ำกันในคลังไฟล์");
    return;
  }
  const wasted = groups.reduce((sum, group) => sum + group._count._all - 1, 0);
  console.log(`พบไฟล์เนื้อหาซ้ำ ${groups.length} กลุ่ม — มีไฟล์ส่วนเกินรวม ${wasted} ไฟล์`);
  for (const group of groups.slice(0, 20)) {
    const assets = await prisma.mediaAsset.findMany({
      where: { checksum: group.checksum },
      select: { originalName: true, url: true, size: true },
      orderBy: { createdAt: "asc" },
    });
    console.log(`  ${assets[0].originalName} (${(assets[0].size / 1024).toFixed(0)} KB) × ${assets.length}`);
    for (const asset of assets) console.log(`    ${asset.url}`);
  }
  if (groups.length > 20) console.log(`  ... และอีก ${groups.length - 20} กลุ่ม`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => getPrisma().$disconnect());
