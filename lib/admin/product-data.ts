import "server-only";
import { getPrisma } from "@/lib/prisma";

export async function getAdminProducts(input: { query?: string; status?: string; categoryId?: number; page?: number }) {
  const page = Math.max(1, input.page || 1);
  const take = 10;
  const where = {
    ...(input.status === "published" ? { published: true } : input.status === "draft" ? { published: false } : {}),
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    ...(input.query
      ? { OR: [{ nameTh: { contains: input.query } }, { nameEn: { contains: input.query } }, { sku: { contains: input.query } }, { slug: { contains: input.query } }] }
      : {}),
  };
  const [items, total] = await Promise.all([
    getPrisma().product.findMany({ where, skip: (page - 1) * take, take, orderBy: { updatedAt: "desc" }, include: { category: { select: { nameTh: true } }, _count: { select: { variants: true } } } }),
    getPrisma().product.count({ where }),
  ]);
  return { items: items.map((item) => ({ ...item, basePrice: item.basePrice === null ? null : Number(item.basePrice) })), total, page, totalPages: Math.max(1, Math.ceil(total / take)) };
}

export async function getProductEditorRecord(id: number) {
  const product = await getPrisma().product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      attributes: { orderBy: { sortOrder: "asc" }, include: { attribute: { include: { values: { orderBy: { sortOrder: "asc" } } } } } },
      attributeLinks: true,
      variants: { orderBy: { sortOrder: "asc" }, include: { attributeValues: true } },
    },
  });
  if (!product) return null;

  // The editor shows one card per attribute holding only the values this product
  // actually offers, so intersect the dictionary values with the product's links.
  const ownedValueIds = new Set(product.attributeLinks.map((link) => link.attributeValueId));

  // Lets the preview label a variant's values instead of printing raw ids.
  const valueLabels: Record<number, { th: string; en: string }> = {};
  for (const link of product.attributes) {
    for (const value of link.attribute.values) valueLabels[value.id] = { th: value.valueTh, en: value.valueEn };
  }

  return {
    ...product,
    valueLabels,
    basePrice: product.basePrice === null ? null : Number(product.basePrice),
    images: product.images.map((image) => ({ url: image.url, altTh: image.altTh || "", altEn: image.altEn || "", sortOrder: image.sortOrder })),
    attributes: product.attributes.map((link) => ({
      attributeId: link.attributeId,
      nameTh: link.attribute.nameTh,
      nameEn: link.attribute.nameEn,
      unit: link.attribute.unit,
      inputType: link.attribute.inputType,
      isVariantAxis: link.isVariantAxis,
      sortOrder: link.sortOrder,
      valueIds: link.attribute.values.filter((value) => ownedValueIds.has(value.id)).map((value) => value.id),
    })),
    variants: product.variants.map((variant) => ({
      sku: variant.sku || "",
      price: Number(variant.price),
      image: variant.image || "",
      isAvailable: variant.isAvailable,
      isDefault: variant.isDefault,
      sortOrder: variant.sortOrder,
      attributeValueIds: variant.attributeValues.map((link) => link.attributeValueId),
    })),
  };
}

export async function getProductEditorOptions() {
  const prisma = getPrisma();
  const [categories, attributes, brands, units, pricingUnits] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { subCategories: { orderBy: { sortOrder: "asc" } } } }),
    // The whole dictionary, not just one category's slice — a product may use any
    // attribute, and the editor's combobox searches across all of them.
    prisma.attribute.findMany({ orderBy: { sortOrder: "asc" }, include: { values: { orderBy: { sortOrder: "asc" } } } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.productUnit.findMany({ orderBy: { nameTh: "asc" } }),
    prisma.pricingUnit.findMany({ orderBy: { nameTh: "asc" } }),
  ]);
  return {
    categories: categories.map((category) => ({ id: category.id, nameTh: category.nameTh, nameEn: category.nameEn, subCategories: category.subCategories.map((sub) => ({ id: sub.id, nameTh: sub.nameTh })) })),
    attributes: attributes.map((attribute) => ({
      id: attribute.id,
      nameTh: attribute.nameTh,
      nameEn: attribute.nameEn,
      unit: attribute.unit,
      inputType: attribute.inputType,
      values: attribute.values.map((value) => ({ id: value.id, valueTh: value.valueTh, valueEn: value.valueEn, colorHex: value.colorHex })),
    })),
    brands: brands.map((x) => ({ id: x.id, name: x.name })),
    units: units.map((x) => ({ id: x.id, nameTh: x.nameTh })),
    pricingUnits: pricingUnits.map((x) => ({ id: x.id, nameTh: x.nameTh })),
  };
}
