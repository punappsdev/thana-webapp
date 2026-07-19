export const CATALOG_RESOURCES = ["categories", "subcategories", "brands", "units", "pricing-units", "attributes", "attribute-values", "article-categories", "category-attributes"] as const;
export type CatalogResource = (typeof CATALOG_RESOURCES)[number];
export const catalogLabels: Record<CatalogResource, string> = { categories: "หมวดหมู่สินค้า", subcategories: "หมวดหมู่ย่อย", brands: "แบรนด์", units: "หน่วยสินค้า", "pricing-units": "หน่วยราคา", attributes: "คุณลักษณะ", "attribute-values": "ค่าคุณลักษณะ", "article-categories": "หมวดบทความ", "category-attributes": "คุณลักษณะประจำหมวด" };
export function isCatalogResource(value: string): value is CatalogResource { return CATALOG_RESOURCES.includes(value as CatalogResource); }
