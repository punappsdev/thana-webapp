import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getPickerProducts, isProductPickerPool } from "@/lib/admin/featured-data";

/**
 * Search pool for the admin product pickers — the featured-products manager on
 * /admin/featured (default pool) and the promotion targeting editor
 * (`?pool=all`, which includes drafts and already-featured products).
 */
export async function GET(request: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); }
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || undefined;
  const page = Number(searchParams.get("page")) || 1;
  const poolParam = searchParams.get("pool");
  const pool = isProductPickerPool(poolParam) ? poolParam : "featurable";
  const result = await getPickerProducts({ query, page, pool });
  return NextResponse.json(result);
}
