import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getFeaturableProducts } from "@/lib/admin/featured-data";

/** Search pool for the featured-products picker on /admin/featured. */
export async function GET(request: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); }
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || undefined;
  const page = Number(searchParams.get("page")) || 1;
  const result = await getFeaturableProducts({ query, page });
  return NextResponse.json(result);
}
