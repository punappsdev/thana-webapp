// Attributes are owned by each product, so there is no category↔attribute
// mapping resource here — the attribute cards in the product form create and
// pick from this dictionary directly.
export const CATALOG_RESOURCES = ["categories", "subcategories", "brands", "units", "pricing-units", "attributes", "attribute-values", "article-categories"] as const;
export type CatalogResource = (typeof CATALOG_RESOURCES)[number];
export const catalogLabels: Record<CatalogResource, string> = { categories: "หมวดหมู่สินค้า", subcategories: "หมวดหมู่ย่อย", brands: "แบรนด์", units: "หน่วยสินค้า", "pricing-units": "หน่วยราคา", attributes: "คุณลักษณะ", "attribute-values": "ตัวเลือกของคุณลักษณะ", "article-categories": "หมวดบทความ" };
export function isCatalogResource(value: string): value is CatalogResource { return CATALOG_RESOURCES.includes(value as CatalogResource); }

// Plain-language metadata used by the hub and the "what is this" banner so that
// non-technical admins understand what each dictionary is for. `group` drives the
// hub sections; `icon` maps to a lucide icon in the hub page.
export type CatalogGroup = "organize" | "brand-unit" | "properties";
export type CatalogMeta = { plainLabel: string; description: string; example: string; group: CatalogGroup; icon: string };

export const catalogGroupLabels: Record<CatalogGroup, string> = {
  organize: "หมวดหมู่และการจัดกลุ่ม",
  "brand-unit": "แบรนด์และหน่วยนับ",
  properties: "คุณสมบัติสินค้า",
};

export const catalogGroupOrder: CatalogGroup[] = ["organize", "brand-unit", "properties"];

export const catalogMeta: Record<CatalogResource, CatalogMeta> = {
  categories: { plainLabel: "หมวดหมู่สินค้า", description: "กลุ่มหลักของสินค้า ใช้จัดหน้าเว็บและเมนู", example: "เช่น กระจก, อะลูมิเนียม, อุปกรณ์", group: "organize", icon: "LayoutGrid" },
  subcategories: { plainLabel: "หมวดหมู่ย่อย", description: "กลุ่มย่อยที่อยู่ภายใต้หมวดหมู่หลัก", example: "เช่น กระจกเทมเปอร์ (อยู่ใต้ กระจก)", group: "organize", icon: "FolderTree" },
  "article-categories": { plainLabel: "หมวดบทความ", description: "กลุ่มของบทความในเว็บไซต์", example: "เช่น บทความให้ความรู้, ข่าวสาร", group: "organize", icon: "Newspaper" },
  brands: { plainLabel: "แบรนด์", description: "ยี่ห้อผู้ผลิตสินค้าที่ใช้ติดกับสินค้า", example: "เช่น Guardian, AGC", group: "brand-unit", icon: "Award" },
  units: { plainLabel: "หน่วยสินค้า", description: "หน่วยนับของสินค้า", example: "เช่น แผ่น, เส้น, ตารางเมตร", group: "brand-unit", icon: "Ruler" },
  "pricing-units": { plainLabel: "หน่วยราคา", description: "หน่วยที่ใช้ตั้งราคาสินค้า", example: "เช่น ราคาต่อ ตร.ม., ราคาต่อแผ่น", group: "brand-unit", icon: "Coins" },
  attributes: { plainLabel: "คุณลักษณะ", description: "ประเภทคุณสมบัติของสินค้า", example: "เช่น สี, ความหนา, ประเภทขอบ", group: "properties", icon: "SlidersHorizontal" },
  "attribute-values": { plainLabel: "ตัวเลือกของคุณลักษณะ", description: "ค่าที่เลือกได้ในแต่ละคุณลักษณะ", example: "เช่น สีแดง (ของ สี), 10 มม. (ของ ความหนา)", group: "properties", icon: "Palette" },
};
