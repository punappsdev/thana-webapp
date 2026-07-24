import "server-only";
import { getPrisma } from "@/lib/prisma";

export type FeaturedProduct = {
  id: number;
  nameTh: string;
  nameEn: string;
  sku: string;
  coverImage: string | null;
  category: string | null;
  published: boolean;
};

/** Products chosen for the homepage "สินค้าแนะนำ" section, in display order. */
export async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  const items = await getPrisma().product.findMany({
    where: { featured: true },
    orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, nameTh: true, nameEn: true, sku: true, coverImage: true, published: true, category: { select: { nameTh: true } } },
  });
  return items.map((item) => ({ ...item, category: item.category?.nameTh ?? null }));
}

/** Published products not yet featured — the pool the picker adds from. */
export async function getFeaturableProducts(input: { query?: string; page?: number }) {
  const page = Math.max(1, input.page || 1);
  const take = 24;
  const query = input.query?.trim();
  const where = {
    published: true,
    featured: false,
    ...(query ? { OR: [{ nameTh: { contains: query } }, { nameEn: { contains: query } }, { sku: { contains: query } }] } : {}),
  };
  const [items, total] = await Promise.all([
    getPrisma().product.findMany({
      where,
      skip: (page - 1) * take,
      take,
      orderBy: { updatedAt: "desc" },
      select: { id: true, nameTh: true, nameEn: true, sku: true, coverImage: true, category: { select: { nameTh: true } } },
    }),
    getPrisma().product.count({ where }),
  ]);
  return {
    items: items.map((item) => ({ id: item.id, nameTh: item.nameTh, nameEn: item.nameEn, sku: item.sku, coverImage: item.coverImage, category: item.category?.nameTh ?? null })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
}
