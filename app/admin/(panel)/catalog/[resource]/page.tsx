import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info, Search } from "lucide-react";
import { CatalogTable } from "@/components/admin/catalog-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { catalogLabels, catalogMeta, isCatalogResource } from "@/lib/admin/catalog-config";
import { getCatalogOptions, getCatalogRows } from "@/lib/admin/catalog-data";

// Decimal fields (e.g. attribute-value numericValue) can't cross to the client
// component as class instances, so serialize every row to plain JSON first.
function serialize(rows: unknown[]): Record<string, unknown>[] {
  return JSON.parse(JSON.stringify(rows, (_key, value) => typeof value === "object" && value && "toString" in value && value.constructor?.name === "Decimal" ? value.toString() : value)) as Record<string, unknown>[];
}

export default async function CatalogResourcePage({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ query?: string; page?: string }> }) {
  const { resource } = await params; if (!isCatalogResource(resource)) notFound();
  const filters = await searchParams;
  const [result, options] = await Promise.all([getCatalogRows(resource, { query: filters.query, page: Number(filters.page) || 1 }), getCatalogOptions()]);
  const rows = serialize(result.items as unknown[]);
  const meta = catalogMeta[resource];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href="/admin/catalog" className="inline-flex items-center gap-1 font-label-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />กลับไปหน้าข้อมูลสินค้า</Link>
        <div>
          <h1 className="font-headline-lg font-semibold">{catalogLabels[resource]}</h1>
          <p className="font-body-sm text-muted-foreground">ทั้งหมด {result.total} รายการ</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 py-4">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-label-md">{meta.description}</p>
            <p className="font-body-sm text-muted-foreground">{meta.example}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <form className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="query" defaultValue={filters.query} placeholder={`ค้นหา${catalogLabels[resource]}`} className="pl-9" />
            </div>
            <Button type="submit" variant="outline">ค้นหา</Button>
          </form>
        </CardContent>
      </Card>

      <CatalogTable resource={resource} rows={rows} categories={options.categories} attributes={options.attributes} />

      <div className="flex items-center justify-between">
        <p className="font-body-sm text-muted-foreground">หน้า {result.page} จาก {result.totalPages}</p>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`?query=${encodeURIComponent(filters.query || "")}&page=${Math.max(1, result.page - 1)}`}>ก่อนหน้า</Link></Button>
          <Button asChild variant="outline"><Link href={`?query=${encodeURIComponent(filters.query || "")}&page=${Math.min(result.totalPages, result.page + 1)}`}>ถัดไป</Link></Button>
        </div>
      </div>
    </div>
  );
}
