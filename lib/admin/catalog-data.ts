import "server-only";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import type { CatalogResource } from "@/lib/admin/catalog-config";

export async function getCatalogRows(resource: CatalogResource, input: { query?: string; page?: number } = {}) {
  await requireAdmin();
  const prisma = getPrisma(); const page = Math.max(1, input.page || 1); const take = 20; const paging = { skip: (page - 1) * take, take };
  const result = await (async () => {
  switch (resource) {
    case "categories": { const where = input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { slug: { contains: input.query } }] } : {}; return Promise.all([prisma.category.findMany({ where, ...paging, orderBy: [{ sortOrder: "asc" }, { nameTh: "asc" }], include: { _count: { select: { products: true, subCategories: true, works: true } } } }), prisma.category.count({ where })]); }
    case "subcategories": { const where = input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { slug: { contains: input.query } }] } : {}; return Promise.all([prisma.subCategory.findMany({ where, ...paging, orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }], include: { category: { select: { nameTh: true } }, _count: { select: { products: true } } } }), prisma.subCategory.count({ where })]); }
    case "brands": { const where = input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { slug: { contains: input.query } }] } : {}; return Promise.all([prisma.brand.findMany({ where, ...paging, orderBy: { nameTh: "asc" }, include: { _count: { select: { products: true } } } }), prisma.brand.count({ where })]); }
    case "units": { const where = input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { code: { contains: input.query } }] } : {}; return Promise.all([prisma.productUnit.findMany({ where, ...paging, orderBy: { nameTh: "asc" }, include: { _count: { select: { products: true } } } }), prisma.productUnit.count({ where })]); }
    case "attributes": { const where = input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { slug: { contains: input.query } }] } : {}; return Promise.all([prisma.attribute.findMany({ where, ...paging, orderBy: [{ sortOrder: "asc" }, { nameTh: "asc" }], include: { _count: { select: { values: true, products: true } } } }), prisma.attribute.count({ where })]); }
    case "attribute-values": { const where = input.query ? { OR: [{ valueTh: { contains: input.query } }, { valueEn: { contains: input.query } }, { slug: { contains: input.query } }] } : {}; return Promise.all([prisma.attributeValue.findMany({ where, ...paging, orderBy: [{ attributeId: "asc" }, { sortOrder: "asc" }], include: { attribute: { select: { nameTh: true } }, _count: { select: { products: true, variants: true } } } }), prisma.attributeValue.count({ where })]); }
    case "article-categories": { const where = input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { slug: { contains: input.query } }] } : {}; return Promise.all([prisma.articleCategory.findMany({ where, ...paging, orderBy: { nameTh: "asc" }, include: { _count: { select: { articles: true } } } }), prisma.articleCategory.count({ where })]); }
  }
  })();
  return { items: result[0], total: result[1], page, totalPages: Math.max(1, Math.ceil(result[1] / take)) };
}

export async function getCatalogCounts(): Promise<Record<CatalogResource, number>> {
  await requireAdmin();
  const prisma = getPrisma();
  const [categories, subcategories, brands, units, attributes, attributeValues, articleCategories] = await Promise.all([
    prisma.category.count(),
    prisma.subCategory.count(),
    prisma.brand.count(),
    prisma.productUnit.count(),
    prisma.attribute.count(),
    prisma.attributeValue.count(),
    prisma.articleCategory.count(),
  ]);
  return { categories, subcategories, brands, units, attributes, "attribute-values": attributeValues, "article-categories": articleCategories };
}

export async function getCatalogOptions() {
  await requireAdmin();
  const prisma = getPrisma();
  const [categories, attributes] = await Promise.all([
    prisma.category.findMany({ orderBy: { nameTh: "asc" }, select: { id: true, nameTh: true } }),
    prisma.attribute.findMany({ orderBy: { nameTh: "asc" }, select: { id: true, nameTh: true } }),
  ]);
  return { categories, attributes };
}

export type CatalogReferenceItem = { id: number; nameTh: string; nameEn: string; href: string; hint?: string };
export type CatalogReferenceGroup = { key: string; label: string; items: CatalogReferenceItem[]; truncated: boolean };
export type CatalogReferences = { groups: CatalogReferenceGroup[] };

const REFERENCE_CAP = 100;

function capItems<T>(rows: T[]): { rows: T[]; truncated: boolean } {
  return rows.length > REFERENCE_CAP
    ? { rows: rows.slice(0, REFERENCE_CAP), truncated: true }
    : { rows, truncated: false };
}

const productName = { id: true, nameTh: true, nameEn: true } as const;
const toProductItem = (p: { id: number; nameTh: string; nameEn: string }): CatalogReferenceItem => ({ id: p.id, nameTh: p.nameTh, nameEn: p.nameEn, href: `/admin/products/${p.id}` });

/**
 * The actual records that reference a catalog entry, grouped by relation type.
 * Pure query — the references API route performs auth before calling this, so it
 * must NOT import or rely on `requireAdmin` here (see /api/admin/catalog/[resource]/[id]/references).
 */
export async function getCatalogReferences(resource: CatalogResource, id: number): Promise<CatalogReferences> {
  const prisma = getPrisma();
  const take = REFERENCE_CAP + 1;
  const groups: CatalogReferenceGroup[] = [];

  switch (resource) {
    case "categories": {
      const [products, subCategories, works] = await Promise.all([
        prisma.product.findMany({ where: { categoryId: id }, orderBy: { nameTh: "asc" }, take, select: productName }),
        prisma.subCategory.findMany({ where: { categoryId: id }, orderBy: { nameTh: "asc" }, take, select: productName }),
        prisma.work.findMany({ where: { categoryId: id }, orderBy: { titleTh: "asc" }, take, select: { id: true, titleTh: true, titleEn: true } }),
      ]);
      const productsCapped = capItems(products);
      const subCapped = capItems(subCategories);
      const worksCapped = capItems(works);
      groups.push(
        { key: "products", label: "สินค้า", items: productsCapped.rows.map(toProductItem), truncated: productsCapped.truncated },
        { key: "subcategories", label: "หมวดหมู่ย่อย", items: subCapped.rows.map((s) => ({ id: s.id, nameTh: s.nameTh, nameEn: s.nameEn, href: "/admin/catalog/subcategories" })), truncated: subCapped.truncated },
        { key: "works", label: "ผลงาน", items: worksCapped.rows.map((w) => ({ id: w.id, nameTh: w.titleTh, nameEn: w.titleEn, href: `/admin/content/works/${w.id}` })), truncated: worksCapped.truncated },
      );
      break;
    }
    case "subcategories": {
      const capped = capItems(await prisma.product.findMany({ where: { subCategoryId: id }, orderBy: { nameTh: "asc" }, take, select: productName }));
      groups.push({ key: "products", label: "สินค้า", items: capped.rows.map(toProductItem), truncated: capped.truncated });
      break;
    }
    case "brands": {
      const capped = capItems(await prisma.product.findMany({ where: { brandId: id }, orderBy: { nameTh: "asc" }, take, select: productName }));
      groups.push({ key: "products", label: "สินค้า", items: capped.rows.map(toProductItem), truncated: capped.truncated });
      break;
    }
    case "units": {
      const capped = capItems(await prisma.product.findMany({ where: { unitId: id }, orderBy: { nameTh: "asc" }, take, select: productName }));
      groups.push({ key: "products", label: "สินค้า", items: capped.rows.map(toProductItem), truncated: capped.truncated });
      break;
    }
    case "attributes": {
      const [products, values] = await Promise.all([
        prisma.product.findMany({ where: { attributes: { some: { attributeId: id } } }, orderBy: { nameTh: "asc" }, take, select: productName }),
        prisma.attributeValue.findMany({ where: { attributeId: id }, orderBy: { valueTh: "asc" }, take, select: { id: true, valueTh: true, valueEn: true } }),
      ]);
      const productsCapped = capItems(products);
      const valuesCapped = capItems(values);
      groups.push(
        { key: "products", label: "สินค้า", items: productsCapped.rows.map(toProductItem), truncated: productsCapped.truncated },
        { key: "values", label: "ตัวเลือก", items: valuesCapped.rows.map((v) => ({ id: v.id, nameTh: v.valueTh, nameEn: v.valueEn, href: "/admin/catalog/attribute-values" })), truncated: valuesCapped.truncated },
      );
      break;
    }
    case "attribute-values": {
      const [products, variants] = await Promise.all([
        prisma.product.findMany({ where: { attributeLinks: { some: { attributeValueId: id } } }, orderBy: { nameTh: "asc" }, take, select: productName }),
        prisma.productVariant.findMany({ where: { attributeValues: { some: { attributeValueId: id } } }, orderBy: { id: "asc" }, take, select: { id: true, sku: true, product: { select: productName } } }),
      ]);
      const productsCapped = capItems(products);
      const variantsCapped = capItems(variants);
      groups.push(
        { key: "products", label: "สินค้า", items: productsCapped.rows.map(toProductItem), truncated: productsCapped.truncated },
        { key: "variants", label: "ตัวเลือกสินค้า", items: variantsCapped.rows.map((v) => ({ id: v.id, nameTh: v.product.nameTh, nameEn: v.product.nameEn, hint: v.sku ? `SKU: ${v.sku}` : undefined, href: `/admin/products/${v.product.id}` })), truncated: variantsCapped.truncated },
      );
      break;
    }
    case "article-categories": {
      const capped = capItems(await prisma.article.findMany({ where: { articleCategoryId: id }, orderBy: { titleTh: "asc" }, take, select: { id: true, titleTh: true, titleEn: true } }));
      groups.push({ key: "articles", label: "บทความ", items: capped.rows.map((a) => ({ id: a.id, nameTh: a.titleTh, nameEn: a.titleEn, href: `/admin/content/articles/${a.id}` })), truncated: capped.truncated });
      break;
    }
  }
  return { groups };
}
