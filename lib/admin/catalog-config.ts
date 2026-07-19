// Attributes are owned by each product, so there is no category↔attribute
// mapping resource here — the attribute cards in the product form create and
// pick from this dictionary directly.
export const CATALOG_RESOURCES = ["categories", "subcategories", "brands", "units", "pricing-units", "attributes", "attribute-values", "article-categories"] as const;
export type CatalogResource = (typeof CATALOG_RESOURCES)[number];
export const catalogLabels: Record<CatalogResource, string> = { categories: "หมวดหมู่สินค้า", subcategories: "หมวดหมู่ย่อย", brands: "แบรนด์", units: "หน่วยสินค้า", "pricing-units": "หน่วยราคา", attributes: "คุณลักษณะ", "attribute-values": "ค่าคุณลักษณะ", "article-categories": "หมวดบทความ" };
export function isCatalogResource(value: string): value is CatalogResource { return CATALOG_RESOURCES.includes(value as CatalogResource); }
