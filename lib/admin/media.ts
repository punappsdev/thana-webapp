import "server-only";

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
