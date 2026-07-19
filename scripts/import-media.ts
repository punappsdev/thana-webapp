import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileTypeFromFile } from "file-type";
import { getPrisma } from "../lib/prisma";
import { validateUploadMetadata } from "../lib/admin/security";

async function walk(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return nested.flat();
}

async function main() {
  const uploadDir = process.env.UPLOAD_DIR;
  if (!uploadDir) throw new Error("UPLOAD_DIR is not configured");
  const files = await walk(uploadDir);
  let imported = 0;
  for (const absolutePath of files) {
    const detected = await fileTypeFromFile(absolutePath).catch(() => undefined);
    if (!detected) continue;
    const stat = await fs.stat(absolutePath);
    const validation = validateUploadMetadata(detected.mime, stat.size);
    if (!validation.ok) continue;
    const relativePath = path.relative(uploadDir, absolutePath);
    const url = `/api/uploads/${relativePath.split(path.sep).map(encodeURIComponent).join("/")}`;
    await getPrisma().mediaAsset.upsert({ where: { path: relativePath }, update: { url, mimeType: detected.mime, kind: validation.kind, size: stat.size }, create: { path: relativePath, url, originalName: path.basename(absolutePath), mimeType: detected.mime, kind: validation.kind, size: stat.size } });
    imported += 1;
  }
  console.log(`นำเข้า MediaAsset ${imported} รายการ`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => getPrisma().$disconnect());
