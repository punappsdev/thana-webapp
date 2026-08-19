import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { isCatalogResource } from "@/lib/admin/catalog-config";
import { getCatalogReferences } from "@/lib/admin/catalog-data";

/**
 * Read-only list of the records that reference a catalog entry (products, works,
 * articles, child dictionary rows, variants). Powers the "ใช้ใน N รายการ" dialog
 * in the catalog settings table.
 */
export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ resource: string; id: string }> },
) {
  try { await requireAdminApi(); } catch { return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); }

  const { resource, id } = await props.params;
  if (!isCatalogResource(resource)) return NextResponse.json({ message: "Invalid resource" }, { status: 400 });
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  const result = await getCatalogReferences(resource, numericId);
  return NextResponse.json(result);
}
