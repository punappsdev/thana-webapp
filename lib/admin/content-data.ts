import "server-only";

import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import type { ContentResource } from "@/lib/admin/content-config";

export type ContentListItem = {
  id: number;
  slug: string;
  titleTh: string;
  titleEn: string;
  coverImage: string | null;
  published: boolean;
  updatedAt: Date;
};

export type ContentImage = {
  url: string;
  altTh: string;
  altEn: string;
  sortOrder: number;
};

/** A product as shown in the targeting editor's chips and picker rows. */
export type TargetProduct = {
  id: number;
  nameTh: string;
  nameEn: string;
  sku: string;
  coverImage: string | null;
  published: boolean;
};

/** Catalog tree for the targeting editor's category / sub-category pickers. */
export type TargetCategoryOption = {
  id: number;
  nameTh: string;
  nameEn: string;
  subCategories: { id: number; nameTh: string; nameEn: string }[];
};

export type ContentRecord = ContentListItem & {
  bodyTh: string;
  bodyEn: string;
  excerptTh: string;
  excerptEn: string;
  categoryId: number | null;
  startDate: Date | null;
  endDate: Date | null;
  /** Gallery rows — only resources with `hasGallery` ever return a non-empty list. */
  images: ContentImage[];
  /** Catalog bindings — only resources with `hasProductTargeting` populate these. */
  showOnAllProducts: boolean;
  targetProducts: TargetProduct[];
  targetCategoryIds: number[];
  targetSubCategoryIds: number[];
};

/** Empty catalog bindings, for the resources that do not have any. */
const NO_TARGETING = {
  showOnAllProducts: false,
  targetProducts: [] as TargetProduct[],
  targetCategoryIds: [] as number[],
  targetSubCategoryIds: [] as number[],
};

export async function getContentList(resource: ContentResource, input: { query?: string; status?: string; page?: number }) {
  await requireAdmin();
  const prisma = getPrisma();
  const page = Math.max(1, input.page || 1);
  const take = 10;
  const where = {
    ...(input.status === "published" ? { published: true } : input.status === "draft" ? { published: false } : {}),
    ...(input.query ? { OR: [{ titleTh: { contains: input.query } }, { titleEn: { contains: input.query } }, { slug: { contains: input.query } }] } : {}),
  };
  const args = { where, orderBy: { updatedAt: "desc" as const }, skip: (page - 1) * take, take };

  switch (resource) {
    case "works": {
      const [items, total] = await Promise.all([prisma.work.findMany(args), prisma.work.count({ where })]);
      return { items, total, page, totalPages: Math.max(1, Math.ceil(total / take)) };
    }
    case "articles": {
      const [items, total] = await Promise.all([prisma.article.findMany(args), prisma.article.count({ where })]);
      return { items, total, page, totalPages: Math.max(1, Math.ceil(total / take)) };
    }
    case "news": {
      const [items, total] = await Promise.all([prisma.news.findMany(args), prisma.news.count({ where })]);
      return { items, total, page, totalPages: Math.max(1, Math.ceil(total / take)) };
    }
    case "promotions": {
      const [items, total] = await Promise.all([prisma.promotion.findMany(args), prisma.promotion.count({ where })]);
      return { items, total, page, totalPages: Math.max(1, Math.ceil(total / take)) };
    }
  }
}

export async function getContentRecord(resource: ContentResource, id: number): Promise<ContentRecord | null> {
  await requireAdmin();
  const prisma = getPrisma();
  switch (resource) {
    case "works": {
      const row = await prisma.work.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } });
      if (!row) return null;
      const { images, ...work } = row;
      return { ...work, bodyTh: row.descriptionTh || "", bodyEn: row.descriptionEn || "", excerptTh: "", excerptEn: "", categoryId: row.categoryId, startDate: null, endDate: null, images: images.map((image) => ({ url: image.url, altTh: image.altTh || "", altEn: image.altEn || "", sortOrder: image.sortOrder })), ...NO_TARGETING };
    }
    case "articles": {
      const row = await prisma.article.findUnique({ where: { id } });
      return row ? { ...row, bodyTh: row.contentTh, bodyEn: row.contentEn, excerptTh: row.excerptTh || "", excerptEn: row.excerptEn || "", categoryId: row.articleCategoryId, startDate: null, endDate: null, images: [], ...NO_TARGETING } : null;
    }
    case "news": {
      const row = await prisma.news.findUnique({ where: { id } });
      return row ? { ...row, bodyTh: row.contentTh, bodyEn: row.contentEn, excerptTh: row.excerptTh || "", excerptEn: row.excerptEn || "", categoryId: null, startDate: null, endDate: null, images: [], ...NO_TARGETING } : null;
    }
    case "promotions": {
      // Bound products come back with their display fields so the editor can
      // render chips without a second round-trip; categories and sub-categories
      // only need ids because the whole catalog tree is loaded for the pickers.
      const row = await prisma.promotion.findUnique({
        where: { id },
        include: {
          targetProducts: { include: { product: { select: { id: true, nameTh: true, nameEn: true, sku: true, coverImage: true, published: true } } } },
          targetCategories: { select: { categoryId: true } },
          targetSubCategories: { select: { subCategoryId: true } },
        },
      });
      if (!row) return null;
      const { targetProducts, targetCategories, targetSubCategories, ...promotion } = row;
      return {
        ...promotion,
        bodyTh: row.contentTh,
        bodyEn: row.contentEn,
        excerptTh: row.excerptTh || "",
        excerptEn: row.excerptEn || "",
        categoryId: null,
        startDate: row.startDate,
        endDate: row.endDate,
        images: [],
        showOnAllProducts: row.showOnAllProducts,
        targetProducts: targetProducts.map((link) => link.product),
        targetCategoryIds: targetCategories.map((link) => link.categoryId),
        targetSubCategoryIds: targetSubCategories.map((link) => link.subCategoryId),
      };
    }
  }
}

/**
 * Catalog tree for the targeting editor. Small enough (tens of rows) to ship to
 * the client whole and filter there, the same way the attribute dictionary is
 * handled in the product editor. Unpublished entries are included on purpose —
 * a promotion can be prepared against a category that is not live yet.
 */
export async function getPromotionTargetOptions(): Promise<TargetCategoryOption[]> {
  await requireAdmin();
  return getPrisma().category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      nameTh: true,
      nameEn: true,
      subCategories: { orderBy: { sortOrder: "asc" }, select: { id: true, nameTh: true, nameEn: true } },
    },
  });
}

export async function getContentCategoryOptions(kind?: "catalog" | "article") {
  await requireAdmin();
  const prisma = getPrisma();
  if (kind === "catalog") return prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameTh: true, nameEn: true } });
  if (kind === "article") return prisma.articleCategory.findMany({ orderBy: { nameTh: "asc" }, select: { id: true, nameTh: true, nameEn: true } });
  return [];
}
