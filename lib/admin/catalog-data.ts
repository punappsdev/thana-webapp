import "server-only";
import { getPrisma } from "@/lib/prisma";
import type { CatalogResource } from "@/lib/admin/catalog-config";

export async function getCatalogRows(resource: CatalogResource, input: { query?: string; page?: number } = {}) {
  const prisma = getPrisma(); const page = Math.max(1, input.page || 1); const take = 20; const paging = { skip: (page - 1) * take, take };
  const result = await (async () => {
  switch (resource) {
    case "categories": { const where = input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { slug: { contains: input.query } }] } : {}; return Promise.all([prisma.category.findMany({ where, ...paging, orderBy: [{ sortOrder: "asc" }, { nameTh: "asc" }], include: { _count: { select: { products: true, subCategories: true, works: true } } } }), prisma.category.count({ where })]); }
    case "subcategories": { const where = input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { slug: { contains: input.query } }] } : {}; return Promise.all([prisma.subCategory.findMany({ where, ...paging, orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }], include: { category: { select: { nameTh: true } }, _count: { select: { products: true } } } }), prisma.subCategory.count({ where })]); }
    case "brands": { const where = input.query ? { OR: [{ name: { contains: input.query } }, { slug: { contains: input.query } }] } : {}; return Promise.all([prisma.brand.findMany({ where, ...paging, orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } }), prisma.brand.count({ where })]); }
    case "units": { const where = input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { code: { contains: input.query } }] } : {}; return Promise.all([prisma.productUnit.findMany({ where, ...paging, orderBy: { nameTh: "asc" }, include: { _count: { select: { products: true } } } }), prisma.productUnit.count({ where })]); }
    case "pricing-units": { const where = input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { code: { contains: input.query } }] } : {}; return Promise.all([prisma.pricingUnit.findMany({ where, ...paging, orderBy: { nameTh: "asc" }, include: { _count: { select: { products: true } } } }), prisma.pricingUnit.count({ where })]); }
    case "attributes": { const where = input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { slug: { contains: input.query } }] } : {}; return Promise.all([prisma.attribute.findMany({ where, ...paging, orderBy: [{ sortOrder: "asc" }, { nameTh: "asc" }], include: { _count: { select: { values: true, products: true } } } }), prisma.attribute.count({ where })]); }
    case "attribute-values": { const where = input.query ? { OR: [{ valueTh: { contains: input.query } }, { valueEn: { contains: input.query } }, { slug: { contains: input.query } }] } : {}; return Promise.all([prisma.attributeValue.findMany({ where, ...paging, orderBy: [{ attributeId: "asc" }, { sortOrder: "asc" }], include: { attribute: { select: { nameTh: true } }, _count: { select: { products: true, variants: true } } } }), prisma.attributeValue.count({ where })]); }
    case "article-categories": { const where = input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { slug: { contains: input.query } }] } : {}; return Promise.all([prisma.articleCategory.findMany({ where, ...paging, orderBy: { nameTh: "asc" }, include: { _count: { select: { articles: true } } } }), prisma.articleCategory.count({ where })]); }
  }
  })();
  return { items: result[0], total: result[1], page, totalPages: Math.max(1, Math.ceil(result[1] / take)) };
}

export async function getCatalogCounts(): Promise<Record<CatalogResource, number>> {
  const prisma = getPrisma();
  const [categories, subcategories, brands, units, pricingUnits, attributes, attributeValues, articleCategories] = await Promise.all([
    prisma.category.count(),
    prisma.subCategory.count(),
    prisma.brand.count(),
    prisma.productUnit.count(),
    prisma.pricingUnit.count(),
    prisma.attribute.count(),
    prisma.attributeValue.count(),
    prisma.articleCategory.count(),
  ]);
  return { categories, subcategories, brands, units, "pricing-units": pricingUnits, attributes, "attribute-values": attributeValues, "article-categories": articleCategories };
}

export async function getCatalogOptions() {
  const prisma = getPrisma();
  const [categories, attributes] = await Promise.all([
    prisma.category.findMany({ orderBy: { nameTh: "asc" }, select: { id: true, nameTh: true } }),
    prisma.attribute.findMany({ orderBy: { nameTh: "asc" }, select: { id: true, nameTh: true } }),
  ]);
  return { categories, attributes };
}
