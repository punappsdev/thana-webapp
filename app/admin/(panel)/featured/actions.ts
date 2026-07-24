"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { getPrisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/admin/validation";

/** The homepage "สินค้าแนะนำ" section and this admin page both read this data. */
function refreshFeatured() {
  revalidatePath("/admin/featured");
  revalidatePath("/");
  revalidatePath("/en");
}

/** Add a product to the featured list, placing it last in display order. */
export async function addFeaturedAction(productId: number): Promise<ActionResult> {
  const admin = await requireAdmin();
  const prisma = getPrisma();
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, nameTh: true, published: true } });
  if (!product) return { success: false, message: "ไม่พบสินค้า" };
  if (!product.published) return { success: false, message: "เผยแพร่สินค้าก่อนจึงจะเพิ่มเป็นสินค้าแนะนำได้" };

  const max = await prisma.product.aggregate({ where: { featured: true }, _max: { featuredOrder: true } });
  await prisma.product.update({ where: { id: productId }, data: { featured: true, featuredOrder: (max._max.featuredOrder ?? 0) + 1 } });
  await recordActivity({ adminId: admin.id, action: "UPDATE", entityType: "products", entityId: productId, label: product.nameTh, metadata: { featured: true } });
  refreshFeatured();
  return { success: true, message: "เพิ่มสินค้าแนะนำแล้ว" };
}

/** Remove a product from the featured list. */
export async function removeFeaturedAction(productId: number): Promise<ActionResult> {
  const admin = await requireAdmin();
  const prisma = getPrisma();
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, nameTh: true } });
  if (!product) return { success: false, message: "ไม่พบสินค้า" };

  await prisma.product.update({ where: { id: productId }, data: { featured: false, featuredOrder: 0 } });
  await recordActivity({ adminId: admin.id, action: "UPDATE", entityType: "products", entityId: productId, label: product.nameTh, metadata: { featured: false } });
  refreshFeatured();
  return { success: true, message: "นำออกจากสินค้าแนะนำแล้ว" };
}

/** Persist a new display order. `orderedIds` is the full featured list, top-first. */
export async function reorderFeaturedAction(orderedIds: number[]): Promise<ActionResult> {
  await requireAdmin();
  const prisma = getPrisma();
  await prisma.$transaction(orderedIds.map((id, index) => prisma.product.update({ where: { id }, data: { featuredOrder: index + 1 } })));
  refreshFeatured();
  return { success: true, message: "จัดลำดับแล้ว" };
}
