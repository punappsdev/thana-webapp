import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit3 } from "lucide-react";
import { Search } from "lucide-react";
import { CatalogEditor } from "@/components/admin/catalog-editor";
import { DeleteCatalogButton } from "@/components/admin/delete-catalog-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogLabels, isCatalogResource } from "@/lib/admin/catalog-config";
import { getCatalogOptions, getCatalogRows } from "@/lib/admin/catalog-data";

function text(row: Record<string, unknown>, ...keys: string[]) { return keys.map((key) => row[key]).filter((value) => value !== null && value !== undefined && value !== "").join(" / "); }

export default async function CatalogResourcePage({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ edit?: string; query?: string; page?: string }> }) {
  const { resource } = await params; if (!isCatalogResource(resource)) notFound();
  const filters = await searchParams; const [result, options] = await Promise.all([getCatalogRows(resource, { query: filters.query, page: Number(filters.page) || 1 }), getCatalogOptions()]);
  const rows = result.items as unknown as Record<string, unknown>[];
  const editRecord = rows.find((row) => Number(row.id) === Number(filters.edit));
  const serializedEdit = editRecord ? JSON.parse(JSON.stringify(editRecord, (_key, value) => typeof value === "object" && value && "toString" in value && value.constructor?.name === "Decimal" ? value.toString() : value)) as Record<string, unknown> : undefined;
  return <div className="space-y-6"><div><h1 className="font-headline-lg font-semibold">{catalogLabels[resource]}</h1><p className="font-body-sm text-muted-foreground">ทั้งหมด {result.total} รายการ</p></div><CatalogEditor resource={resource} edit={serializedEdit} categories={options.categories} attributes={options.attributes} /><Card><CardContent className="pt-6"><form className="flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="query" defaultValue={filters.query} placeholder="ค้นหาข้อมูล" className="pl-9" /></div><Button type="submit" variant="outline">ค้นหา</Button></form></CardContent></Card><Card><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>ข้อมูล</TableHead><TableHead>รหัส / Slug</TableHead><TableHead>การอ้างอิง</TableHead><TableHead className="text-right">จัดการ</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => { const count = row._count && typeof row._count === "object" ? Object.values(row._count as Record<string, number>).reduce((sum, value) => sum + value, 0) : 0; return <TableRow key={String(row.id)}><TableCell><p className="font-label-md font-semibold">{text(row, "nameTh", "valueTh", "name") || `${catalogLabels[resource]} #${String(row.id)}`}</p><p className="font-body-sm text-muted-foreground">{text(row, "nameEn", "valueEn")}</p></TableCell><TableCell className="font-body-sm">{text(row, "slug", "code") || "—"}</TableCell><TableCell className="font-body-sm">{count} รายการ</TableCell><TableCell><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon-sm"><Link href={`?query=${encodeURIComponent(filters.query || "")}&page=${result.page}&edit=${String(row.id)}`} aria-label="แก้ไข"><Edit3 className="size-4" /></Link></Button><DeleteCatalogButton resource={resource} id={Number(row.id)} /></div></TableCell></TableRow>; })}</TableBody></Table></CardContent></Card><div className="flex justify-between"><p className="font-body-sm text-muted-foreground">หน้า {result.page} จาก {result.totalPages}</p><div className="flex gap-2"><Button asChild variant="outline"><Link href={`?query=${encodeURIComponent(filters.query || "")}&page=${Math.max(1, result.page - 1)}`}>ก่อนหน้า</Link></Button><Button asChild variant="outline"><Link href={`?query=${encodeURIComponent(filters.query || "")}&page=${Math.min(result.totalPages, result.page + 1)}`}>ถัดไป</Link></Button></div></div></div>;
}
