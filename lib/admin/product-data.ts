import "server-only";
import { getPrisma } from "@/lib/prisma";

export async function getAdminProducts(input: { query?: string; status?: string; categoryId?: number; page?: number }) {
  const page = Math.max(1, input.page || 1); const take = 10;
  const where = { ...(input.status === "published" ? { published: true } : input.status === "draft" ? { published: false } : {}), ...(input.categoryId ? { categoryId: input.categoryId } : {}), ...(input.query ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { sku: { contains: input.query } }, { slug: { contains: input.query } }] } : {}) };
  const [items, total] = await Promise.all([getPrisma().product.findMany({ where, skip: (page - 1) * take, take, orderBy: { updatedAt: "desc" }, include: { category: { select: { nameTh: true } }, _count: { select: { variants: true } } } }), getPrisma().product.count({ where })]);
  return { items: items.map((item) => ({ ...item, basePrice: item.basePrice === null ? null : Number(item.basePrice) })), total, page, totalPages: Math.max(1, Math.ceil(total / take)) };
}

export async function getProductEditorRecord(id: number) {
  const product = await getPrisma().product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } }, attributeLinks: true, variants: { orderBy: { sortOrder: "asc" }, include: { attributeValues: true } } } });
  if (!product) return null;
  return { ...product, basePrice: product.basePrice === null ? null : Number(product.basePrice), images: product.images.map((image) => ({ url: image.url, altTh: image.altTh || "", altEn: image.altEn || "", sortOrder: image.sortOrder })), attributeValueIds: product.attributeLinks.map((link) => link.attributeValueId), variants: product.variants.map((variant) => ({ sku: variant.sku || "", price: Number(variant.price), comparePrice: variant.comparePrice === null ? ("" as const) : Number(variant.comparePrice), image: variant.image || "", isAvailable: variant.isAvailable, isDefault: variant.isDefault, sortOrder: variant.sortOrder, attributeValueIds: variant.attributeValues.map((link) => link.attributeValueId) })) };
}

export async function getProductEditorOptions() {
  const prisma = getPrisma();
  const [categories, brands, units, pricingUnits] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { subCategories: { orderBy: { sortOrder: "asc" } }, attributes: { orderBy: { sortOrder: "asc" }, include: { attribute: { include: { values: { orderBy: { sortOrder: "asc" } } } } } } } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }), prisma.productUnit.findMany({ orderBy: { nameTh: "asc" } }), prisma.pricingUnit.findMany({ orderBy: { nameTh: "asc" } }),
  ]);
  return { categories: categories.map((category) => ({ id: category.id, nameTh: category.nameTh, nameEn: category.nameEn, subCategories: category.subCategories.map((sub) => ({ id: sub.id, nameTh: sub.nameTh })), attributes: category.attributes.map((mapping) => ({ id: mapping.attribute.id, nameTh: mapping.attribute.nameTh, isRequired: mapping.isRequired, values: mapping.attribute.values.map((value) => ({ id: value.id, valueTh: value.valueTh, valueEn: value.valueEn, colorHex: value.colorHex })) })) })), brands: brands.map((x) => ({ id: x.id, name: x.name })), units: units.map((x) => ({ id: x.id, nameTh: x.nameTh })), pricingUnits: pricingUnits.map((x) => ({ id: x.id, nameTh: x.nameTh })) };
}
