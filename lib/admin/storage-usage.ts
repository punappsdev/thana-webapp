import "server-only";

import fs from "node:fs/promises";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * ภาพรวมพื้นที่จัดเก็บสำหรับการ์ดในหน้าตั้งค่า
 *
 * ขนาดที่ใช้จริงอ่านจากฐานข้อมูล ไม่ได้เดินไล่ดิสก์ทุกครั้งที่เปิดหน้า — UPLOAD_DIR
 * มีไฟล์หลักหมื่นได้และการ stat ทีละไฟล์จะหน่วงหน้าตั้งค่าโดยไม่จำเป็น ส่วนต่างระหว่าง
 * ตัวเลขนี้กับพื้นที่ที่ใช้จริงบนดิสก์คือไฟล์กำพร้า ซึ่ง scripts/sweep-uploads.ts หาเจอ
 */
export type StorageUsage = {
  /** null เมื่ออ่านข้อมูลระบบไฟล์ไม่ได้ เช่น UPLOAD_DIR ไม่ได้ตั้งค่าหรือถูกถอด mount */
  volume: { totalBytes: number; freeBytes: number; usedPercent: number } | null;
  mediaBytes: number;
  mediaCount: number;
  boqBytes: number;
  boqCount: number;
  /** คำขอที่เก่าที่สุดที่ยังมีข้อมูลส่วนบุคคลอยู่ ใช้ดูว่างาน retention ทำงานอยู่จริง */
  oldestQuotationAt: Date | null;
  /** จำนวนใบที่ถูกลบข้อมูลส่วนบุคคลไปแล้ว */
  anonymizedCount: number;
};

export type StorageLevel = "ok" | "warning" | "critical";

export function storageLevel(usedPercent: number): StorageLevel {
  if (usedPercent >= 90) return "critical";
  if (usedPercent >= 75) return "warning";
  return "ok";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} ไบต์`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

export async function getStorageUsage(): Promise<StorageUsage> {
  await requireAdmin();
  const prisma = getPrisma();

  const [volume, media, boq, oldest, anonymizedCount] = await Promise.all([
    readVolume(),
    prisma.mediaAsset.aggregate({ _sum: { size: true }, _count: true }),
    prisma.quotationRequest.aggregate({
      where: { boqStoragePath: { not: null } },
      _sum: { boqSize: true },
      _count: true,
    }),
    prisma.quotationRequest.findFirst({
      where: { anonymizedAt: null },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.quotationRequest.count({ where: { anonymizedAt: { not: null } } }),
  ]);

  return {
    volume,
    mediaBytes: media._sum.size ?? 0,
    mediaCount: media._count,
    boqBytes: boq._sum.boqSize ?? 0,
    boqCount: boq._count,
    oldestQuotationAt: oldest?.createdAt ?? null,
    anonymizedCount,
  };
}

/**
 * พื้นที่ว่างของ volume ที่ UPLOAD_DIR อยู่ อ่านผ่าน fs.statfs จึงไม่ต้องเรียกคำสั่งเชลล์
 * และทำงานได้ทั้งบน Linux ของเซิร์ฟเวอร์จริงและ Windows ของเครื่องพัฒนา
 *
 * ใช้ bavail (ว่างสำหรับผู้ใช้ทั่วไป) ไม่ใช่ bfree เพราะ ext4 กันบล็อกส่วนหนึ่งไว้ให้ root
 * ตัวเลขที่แอดมินเห็นจึงตรงกับพื้นที่ที่โปรเซส Next เขียนได้จริง
 */
async function readVolume(): Promise<StorageUsage["volume"]> {
  const uploadDir = process.env.UPLOAD_DIR;
  if (!uploadDir) return null;

  try {
    const stat = await fs.statfs(uploadDir);
    const totalBytes = stat.bsize * Number(stat.blocks);
    const freeBytes = stat.bsize * Number(stat.bavail);
    if (totalBytes <= 0) return null;
    return {
      totalBytes,
      freeBytes,
      usedPercent: Math.round(((totalBytes - freeBytes) / totalBytes) * 100),
    };
  } catch (error) {
    console.error("[storage] อ่านพื้นที่ว่างของ UPLOAD_DIR ไม่สำเร็จ", error);
    return null;
  }
}
