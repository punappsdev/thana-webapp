import "server-only";

import fs from "node:fs/promises";
import { resolveUploadPath } from "@/lib/admin/security";
import { getPrisma } from "@/lib/prisma";

export async function countMediaReferences(url: string): Promise<number> {
  const prisma = getPrisma();
  const counts = await Promise.all([
    prisma.product.count({ where: { OR: [{ coverImage: url }, { catalogPdf: url }, { images: { some: { url } } }, { variants: { some: { image: url } } }] } }),
    prisma.category.count({ where: { coverImage: url } }),
    prisma.subCategory.count({ where: { coverImage: url } }),
    prisma.brand.count({ where: { logo: url } }),
    prisma.work.count({ where: { coverImage: url } }),
    prisma.article.count({ where: { OR: [{ coverImage: url }, { contentTh: { contains: url } }, { contentEn: { contains: url } }] } }),
    prisma.news.count({ where: { OR: [{ coverImage: url }, { contentTh: { contains: url } }, { contentEn: { contains: url } }] } }),
    prisma.promotion.count({ where: { OR: [{ coverImage: url }, { contentTh: { contains: url } }, { contentEn: { contains: url } }] } }),
  ]);
  return counts.reduce((sum, count) => sum + count, 0);
}

/** Only files we host under /api/uploads are ever eligible for deletion. */
export function isUploadUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith("/api/uploads/");
}

const UPLOAD_URL_PATTERN = /\/api\/uploads\/[^\s"'<>()]+/g;

/** Pulls every hosted upload URL out of a rich-text HTML body (deduped). */
export function extractUploadUrls(html: string | null | undefined): string[] {
  if (!html) return [];
  return [...new Set(html.match(UPLOAD_URL_PATTERN) ?? [])];
}

/** Removes the MediaAsset row and its file on disk (tolerating a missing file). */
export async function unlinkMediaAsset(asset: { id: string; path: string }): Promise<void> {
  await getPrisma().mediaAsset.delete({ where: { id: asset.id } });
  const uploadDir = process.env.UPLOAD_DIR;
  if (!uploadDir) return;
  await fs.unlink(resolveUploadPath(uploadDir, asset.path)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}

/**
 * Deletes the file behind `url` only when nothing references it anymore — the
 * reference count is what makes reuse across records safe. Best-effort: a failure
 * here must never break the save/delete that triggered it.
 */
export async function deleteMediaIfOrphaned(url: string): Promise<void> {
  try {
    if (!isUploadUrl(url)) return;
    if ((await countMediaReferences(url)) > 0) return;
    const asset = await getPrisma().mediaAsset.findUnique({ where: { url } });
    if (asset) await unlinkMediaAsset(asset);
  } catch (error) {
    console.error("[media] deleteMediaIfOrphaned failed", url, error);
  }
}

/** Best-effort cleanup for a batch of (possibly null) URLs. */
export async function deleteOrphanedMedia(urls: (string | null | undefined)[]): Promise<void> {
  const unique = [...new Set(urls.filter(isUploadUrl))];
  await Promise.all(unique.map((url) => deleteMediaIfOrphaned(url)));
}
