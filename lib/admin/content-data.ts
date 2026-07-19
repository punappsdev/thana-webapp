import "server-only";

import { getPrisma } from "@/lib/prisma";
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

export type ContentRecord = ContentListItem & {
  bodyTh: string;
  bodyEn: string;
  excerptTh: string;
  excerptEn: string;
  categoryId: number | null;
  startDate: Date | null;
  endDate: Date | null;
};

export async function getContentList(resource: ContentResource, input: { query?: string; status?: string; page?: number }) {
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
  const prisma = getPrisma();
  switch (resource) {
    case "works": {
      const row = await prisma.work.findUnique({ where: { id } });
      return row ? { ...row, bodyTh: row.descriptionTh || "", bodyEn: row.descriptionEn || "", excerptTh: "", excerptEn: "", categoryId: row.categoryId, startDate: null, endDate: null } : null;
    }
    case "articles": {
      const row = await prisma.article.findUnique({ where: { id } });
      return row ? { ...row, bodyTh: row.contentTh, bodyEn: row.contentEn, excerptTh: row.excerptTh || "", excerptEn: row.excerptEn || "", categoryId: row.articleCategoryId, startDate: null, endDate: null } : null;
    }
    case "news": {
      const row = await prisma.news.findUnique({ where: { id } });
      return row ? { ...row, bodyTh: row.contentTh, bodyEn: row.contentEn, excerptTh: row.excerptTh || "", excerptEn: row.excerptEn || "", categoryId: null, startDate: null, endDate: null } : null;
    }
    case "promotions": {
      const row = await prisma.promotion.findUnique({ where: { id } });
      return row ? { ...row, bodyTh: row.contentTh, bodyEn: row.contentEn, excerptTh: row.excerptTh || "", excerptEn: row.excerptEn || "", categoryId: null, startDate: row.startDate, endDate: row.endDate } : null;
    }
  }
}

export async function getContentCategoryOptions(kind?: "catalog" | "article") {
  const prisma = getPrisma();
  if (kind === "catalog") return prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameTh: true, nameEn: true } });
  if (kind === "article") return prisma.articleCategory.findMany({ orderBy: { nameTh: "asc" }, select: { id: true, nameTh: true, nameEn: true } });
  return [];
}
