export const CONTENT_RESOURCES = ["works", "articles", "news", "promotions"] as const;
export type ContentResource = (typeof CONTENT_RESOURCES)[number];

export type ContentConfig = {
  resource: ContentResource;
  singular: string;
  plural: string;
  publicPath: string;
  bodyKind: "plain" | "rich";
  hasExcerpt: boolean;
  categoryKind?: "catalog" | "article";
  hasPromotionDates?: boolean;
};

export const contentConfigs: Record<ContentResource, ContentConfig> = {
  works: { resource: "works", singular: "ผลงาน", plural: "ผลงาน", publicPath: "/portfolio", bodyKind: "plain", hasExcerpt: false, categoryKind: "catalog" },
  articles: { resource: "articles", singular: "บทความ", plural: "บทความ", publicPath: "/articles", bodyKind: "rich", hasExcerpt: true, categoryKind: "article" },
  news: { resource: "news", singular: "ข่าว", plural: "ข่าว", publicPath: "/news", bodyKind: "rich", hasExcerpt: true },
  promotions: { resource: "promotions", singular: "โปรโมชั่น", plural: "โปรโมชั่น", publicPath: "/news", bodyKind: "rich", hasExcerpt: true, hasPromotionDates: true },
};

export function isContentResource(value: string): value is ContentResource {
  return CONTENT_RESOURCES.includes(value as ContentResource);
}
