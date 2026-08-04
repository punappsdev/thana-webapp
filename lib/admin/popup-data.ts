import "server-only";

import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import type { PopupFrequency, PromotionPopup } from "@/generated/prisma/client";

/**
 * Everything the homepage popup needs to render, flattened for a client component.
 * `width`/`height` come from the MediaAsset row so next/image reserves the right
 * box and the artwork is never squashed to a guessed aspect ratio.
 */
export type ActivePopup = {
  id: number;
  imageUrl: string;
  width: number;
  height: number;
  altTh: string | null;
  altEn: string | null;
  linkUrl: string | null;
  frequency: PopupFrequency;
  /** ISO strings — client re-checks the window because the homepage is cached. */
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
};

/** Fallback shape for images uploaded before MediaAsset tracked dimensions —
 *  the 16:9 landscape the admin form asks for. */
const FALLBACK_WIDTH = 1200;
const FALLBACK_HEIGHT = 675;

/** Shared tie-break: the admin's priority first, newest edit only as a fallback. */
const POPUP_ORDER = [{ sortOrder: "asc" }, { updatedAt: "desc" }] as const;

/** All popups for the admin list, in the same order the homepage picks from. */
export async function getPopupList(): Promise<PromotionPopup[]> {
  await requireAdmin();
  return getPrisma().promotionPopup.findMany({ orderBy: [...POPUP_ORDER] });
}

/** A single popup for the edit form (null when missing). */
export async function getPopupRecord(id: number): Promise<PromotionPopup | null> {
  await requireAdmin();
  return getPrisma().promotionPopup.findUnique({ where: { id } });
}

/**
 * The one popup the homepage should offer right now: published and inside its
 * date window. When several qualify the admin's `sortOrder` decides, so the
 * choice is never an invisible side effect of who was edited last.
 */
export async function getActivePopup(): Promise<ActivePopup | null> {
  const prisma = getPrisma();
  const now = new Date();
  const popup = await prisma.promotionPopup.findFirst({
    where: {
      published: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: [...POPUP_ORDER],
  });
  if (!popup) return null;

  const asset = await prisma.mediaAsset.findUnique({
    where: { url: popup.imageUrl },
    select: { width: true, height: true },
  });

  return {
    id: popup.id,
    imageUrl: popup.imageUrl,
    width: asset?.width ?? FALLBACK_WIDTH,
    height: asset?.height ?? FALLBACK_HEIGHT,
    altTh: popup.altTh,
    altEn: popup.altEn,
    linkUrl: popup.linkUrl,
    frequency: popup.frequency,
    startDate: popup.startDate?.toISOString() ?? null,
    endDate: popup.endDate?.toISOString() ?? null,
    updatedAt: popup.updatedAt.toISOString(),
  };
}
