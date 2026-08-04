import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { getPrisma } from "../lib/prisma";

/**
 * เก็บกวาดไฟล์ใน UPLOAD_DIR ที่ไม่มีแถวในฐานข้อมูลชี้ถึงแล้ว
 *
 * ไฟล์กำพร้าเกิดได้สองทาง: โปรเซสถูก kill ระหว่าง fs.rename กับ commit ของ transaction
 * (ดู storeBoqFile ใน lib/quotation-boq.ts) หรืองาน retention ตายกลางทางหลังลบแถวแล้ว
 * ทั้งสองกรณีไม่มีใครรู้จักไฟล์นั้นอีกเลย จึงต้องมีตัวกวาดแยก
 *
 * ค่าเริ่มต้นเป็น dry run เสมอ ต้องใส่ --delete ถึงจะลบจริง
 */

/** กันไฟล์ที่กำลังอัปโหลดอยู่ระหว่าง rename กับ commit ไม่ให้โดนลบ */
const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;

/** ไฟล์ .tmp ที่ค้างเกินหนึ่งชั่วโมงคือซากจาก crash แน่นอน */
const TEMP_GRACE_MS = 60 * 60 * 1000;

type Candidate = { relativePath: string; absolutePath: string; size: number; mtime: Date };

async function walk(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? walk(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    ),
  );
  return nested.flat();
}

function toPosix(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

async function main() {
  const uploadDir = process.env.UPLOAD_DIR;
  if (!uploadDir) throw new Error("UPLOAD_DIR is not configured");

  const shouldDelete = process.argv.includes("--delete");
  const shouldDeleteMedia = process.argv.includes("--delete-media");
  const prisma = getPrisma();
  const now = Date.now();

  // อ่านคอลัมน์เดียวจากทั้งสองตารางทีเดียวแล้วเทียบในหน่วยความจำ
  // ยิงคิวรีต่อไฟล์จะช้ากว่ามากเมื่อ UPLOAD_DIR มีไฟล์หลักหมื่น
  const [boqRows, mediaRows] = await Promise.all([
    prisma.quotationRequest.findMany({
      where: { boqStoragePath: { not: null } },
      select: { boqStoragePath: true },
    }),
    prisma.mediaAsset.findMany({ select: { path: true } }),
  ]);
  const known = new Set([
    ...boqRows.map((row) => toPosix(row.boqStoragePath as string)),
    ...mediaRows.map((row) => toPosix(row.path)),
  ]);

  const temporary: Candidate[] = [];
  const orphanedBoq: Candidate[] = [];
  const orphanedMedia: Candidate[] = [];
  const unknown: Candidate[] = [];

  for (const absolutePath of await walk(uploadDir)) {
    const stat = await fs.stat(absolutePath).catch(() => null);
    if (!stat?.isFile()) continue;

    const relativePath = toPosix(path.relative(uploadDir, absolutePath));
    const candidate: Candidate = {
      relativePath,
      absolutePath,
      size: stat.size,
      mtime: stat.mtime,
    };
    const age = now - stat.mtimeMs;

    if (relativePath.endsWith(".tmp")) {
      if (age > TEMP_GRACE_MS) temporary.push(candidate);
      continue;
    }
    if (known.has(relativePath) || age <= ORPHAN_GRACE_MS) continue;

    if (relativePath.startsWith("quote-boq/")) orphanedBoq.push(candidate);
    else if (relativePath.startsWith("media/")) orphanedMedia.push(candidate);
    else unknown.push(candidate);
  }

  report("ไฟล์ชั่วคราวที่ค้างจาก crash (.tmp)", temporary);
  report("ไฟล์ BOQ ที่ไม่มีคำขอชี้ถึงแล้ว", orphanedBoq);
  report("ไฟล์ media ที่ไม่มีแถว MediaAsset", orphanedMedia);
  report("ไฟล์นอกโครงสร้างที่ระบบไม่รู้จัก (ไม่ลบอัตโนมัติ)", unknown);

  if (!shouldDelete) {
    console.log("[sweep] โหมด DRY RUN — ใส่ --delete เพื่อลบจริง");
    return;
  }

  let removed = 0;
  let freed = 0;
  for (const candidate of [...temporary, ...orphanedBoq]) {
    await fs.unlink(candidate.absolutePath);
    removed += 1;
    freed += candidate.size;
  }

  // media ไม่ลบอัตโนมัติเพราะ scripts/import-media.ts มีอยู่ก็เพราะไฟล์อาจถูกวางไว้
  // ก่อนตาราง MediaAsset จะมีแถว การกวาดจึงลบของที่ตั้งใจใส่ไว้เองได้
  if (shouldDeleteMedia) {
    for (const candidate of orphanedMedia) {
      await fs.unlink(candidate.absolutePath);
      removed += 1;
      freed += candidate.size;
    }
  } else if (orphanedMedia.length > 0) {
    console.log("[sweep] ข้าม media ทั้งหมด — ใส่ --delete-media ถ้าต้องการลบด้วย");
  }

  console.log(`[sweep] ลบไป ${removed} ไฟล์ คืนพื้นที่ ${formatBytes(freed)}`);
}

function report(title: string, candidates: Candidate[]) {
  const total = candidates.reduce((sum, candidate) => sum + candidate.size, 0);
  console.log(`[sweep] ${title}: ${candidates.length} ไฟล์ (${formatBytes(total)})`);
  for (const candidate of candidates.slice(0, 20)) {
    console.log(
      `[sweep]   ${candidate.relativePath} · ${formatBytes(candidate.size)} · ${candidate.mtime.toISOString()}`,
    );
  }
  if (candidates.length > 20) {
    console.log(`[sweep]   ... และอีก ${candidates.length - 20} ไฟล์`);
  }
}

main()
  .catch((error) => {
    console.error("[sweep] ล้มเหลว:", error);
    process.exitCode = 1;
  })
  .finally(async () => getPrisma().$disconnect());
