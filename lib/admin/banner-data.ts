import "server-only";

import { getPrisma } from "@/lib/prisma";
import type { Banner } from "@/generated/prisma/client";

/** Homepage banner slides for the admin list, ordered as they appear in the carousel. */
export async function getHomepageBannerList(): Promise<Banner[]> {
  return getPrisma().banner.findMany({
    where: { type: "HOMEPAGE" },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

/** A single homepage banner for the edit form (null when missing or not a homepage banner). */
export async function getHomepageBannerRecord(id: number): Promise<Banner | null> {
  const banner = await getPrisma().banner.findUnique({ where: { id } });
  return banner && banner.type === "HOMEPAGE" ? banner : null;
}

/** Published homepage banners rendered by the front-page hero, in carousel order. */
export async function getPublishedHomepageBanners(): Promise<Banner[]> {
  return getPrisma().banner.findMany({
    where: { type: "HOMEPAGE", published: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}
