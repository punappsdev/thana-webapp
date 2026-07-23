import "server-only";

import { getPrisma } from "@/lib/prisma";
import type { Banner, BannerType } from "@/generated/prisma/client";

export type PromotionOption = { id: number; titleTh: string; titleEn: string; slug: string };

/** Banners of one type for the admin list, ordered as they appear in the carousel. */
export async function getBannerList(type: BannerType): Promise<Banner[]> {
  return getPrisma().banner.findMany({
    where: { type },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

/** A single banner for the edit form (any type; null when missing). */
export async function getBannerRecord(id: number): Promise<Banner | null> {
  return getPrisma().banner.findUnique({ where: { id } });
}

/** Published homepage banners rendered by the front-page hero, in carousel order. */
export async function getPublishedHomepageBanners(): Promise<Banner[]> {
  return getPrisma().banner.findMany({
    where: { type: "HOMEPAGE", published: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

/**
 * Published promotion banners for the /news slider, including the linked
 * promotion's slug so a click can open its detail page.
 */
export async function getActivePromotionBanners() {
  return getPrisma().banner.findMany({
    where: { type: "PROMOTION", published: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { promotion: { select: { slug: true } } },
  });
}

/** Promotions offered in the banner form's "linked promotion" selector. */
export async function getPromotionOptions(): Promise<PromotionOption[]> {
  return getPrisma().promotion.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, titleTh: true, titleEn: true, slug: true },
  });
}
