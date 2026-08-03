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

/**
 * Which products a picker may choose from.
 * - `featurable`: published products not yet featured — the homepage picker.
 * - `all`: the whole catalog, drafts included. Promotions bind to products
 *   ahead of launch, so a draft has to be selectable; the picker labels it.
 */
export type ProductPickerPool = "featurable" | "all";

export function isProductPickerPool(value: string | null): value is ProductPickerPool {
  return value === "featurable" || value === "all";
}

/** Search pool backing the admin product pickers. */
export async function getPickerProducts(input: { query?: string; page?: number; pool?: ProductPickerPool }) {
  const page = Math.max(1, input.page || 1);
  const take = 24;
  const query = input.query?.trim();
  const where = {
    ...(input.pool === "all" ? {} : { published: true, featured: false }),
    ...(query ? { OR: [{ nameTh: { contains: query } }, { nameEn: { contains: query } }, { sku: { contains: query } }] } : {}),
  };
  const [items, total] = await Promise.all([
    getPrisma().product.findMany({
      where,
      skip: (page - 1) * take,
      take,
      orderBy: { updatedAt: "desc" },
      select: { id: true, nameTh: true, nameEn: true, sku: true, coverImage: true, published: true, category: { select: { nameTh: true } } },
    }),
    getPrisma().product.count({ where }),
  ]);
  return {
    items: items.map((item) => ({ id: item.id, nameTh: item.nameTh, nameEn: item.nameEn, sku: item.sku, coverImage: item.coverImage, published: item.published, category: item.category?.nameTh ?? null })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
}
