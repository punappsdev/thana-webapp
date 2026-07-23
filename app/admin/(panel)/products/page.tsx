import Link from "next/link";
import { Edit3, Eye, Plus, Search } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { AdminSelect } from "@/components/admin/admin-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminProducts, getProductEditorOptions } from "@/lib/admin/product-data";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ query?: string; status?: string; category?: string; page?: string }> }) {
  const filters = await searchParams; const categoryId = Number(filters.category) || undefined;
  const [result, options] = await Promise.all([getAdminProducts({ query: filters.query, status: filters.status, categoryId, page: Number(filters.page) || 1 }), getProductEditorOptions()]);
  const hasFilter = Boolean(filters.query) || (filters.status && filters.status !== "all") || (filters.category && filters.category !== "all");
  // Keep the active filters when paging, otherwise page 2 would reset the search.
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.query) params.set("query", filters.query);
    if (filters.status) params.set("status", filters.status);
    if (filters.category) params.set("category", filters.category);
    params.set("page", String(page));
    return `?${params}`;
  };
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h1 className="font-headline-lg font-semibold">จัดการสินค้า</h1><p className="font-body-sm text-muted-foreground">ทั้งหมด {result.total} รายการ</p></div><Button asChild><Link href="/admin/products/new"><Plus className="size-4" />เพิ่มสินค้า</Link></Button></div><Card><CardContent className="pt-6"><form className="grid gap-3 md:grid-cols-[1fr_220px_180px_auto]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="query" defaultValue={filters.query} placeholder="ชื่อ, SKU หรือชื่อในลิงก์" className="pl-9 font-body-sm" /></div><AdminSelect name="category" defaultValue={filters.category || "all"} className="w-full" options={[{ value: "all", label: "ทุกหมวดหมู่" }, ...options.categories.map((category) => ({ value: String(category.id), label: category.nameTh }))]} /><AdminSelect name="status" defaultValue={filters.status || "all"} className="w-full" options={[{ value: "all", label: "ทุกสถานะ" }, { value: "published", label: "เผยแพร่" }, { value: "draft", label: "ฉบับร่าง" }]} /><Button type="submit" variant="outline">ค้นหา</Button></form></CardContent></Card><Card><CardContent className="overflow-x-auto p-0">{result.items.length ? <Table><TableHeader><TableRow><TableHead>สินค้า</TableHead><TableHead>SKU</TableHead><TableHead>หมวดหมู่</TableHead><TableHead>ราคา</TableHead><TableHead>จำนวนตัวเลือก</TableHead><TableHead>สถานะ</TableHead><TableHead className="text-right">จัดการ</TableHead></TableRow></TableHeader><TableBody>{result.items.map((product) => <TableRow key={product.id}><TableCell><p className="font-label-md font-semibold">{product.nameTh}</p><p className="font-body-sm text-muted-foreground">{product.nameEn}</p></TableCell><TableCell className="font-body-sm">{product.sku}</TableCell><TableCell className="font-body-sm">{product.category?.nameTh || "—"}</TableCell><TableCell className="font-body-sm">{product.basePrice === null ? "—" : product.basePrice.toLocaleString("th-TH", { style: "currency", currency: product.currency })}</TableCell><TableCell className="font-body-sm">{product._count.variants}</TableCell><TableCell><Badge variant={product.published ? "default" : "secondary"}>{product.published ? "เผยแพร่" : "ฉบับร่าง"}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon-sm"><Link href={`/admin/preview/products/${product.id}`} target="_blank"><Eye className="size-4" /></Link></Button><Button asChild variant="ghost" size="icon-sm"><Link href={`/admin/products/${product.id}`}><Edit3 className="size-4" /></Link></Button><DeleteProductButton id={product.id} name={product.nameTh} published={product.published} /></div></TableCell></TableRow>)}</TableBody></Table> : <p className="py-16 text-center font-body-sm text-muted-foreground">{hasFilter ? "ไม่พบสินค้าที่ตรงกับการค้นหา" : "ยังไม่มีสินค้า กด “เพิ่มสินค้า” เพื่อสร้างรายการแรก"}</p>}</CardContent></Card>
    {result.totalPages > 1 ? <div className="flex items-center justify-between">
      <p className="font-body-sm text-muted-foreground">หน้า {result.page} จาก {result.totalPages}</p>
      <div className="flex gap-2">
        <Button asChild={result.page > 1} variant="outline" disabled={result.page <= 1}>
          {result.page > 1 ? <Link href={pageHref(result.page - 1)}>ก่อนหน้า</Link> : <span>ก่อนหน้า</span>}
        </Button>
        <Button asChild={result.page < result.totalPages} variant="outline" disabled={result.page >= result.totalPages}>
          {result.page < result.totalPages ? <Link href={pageHref(result.page + 1)}>ถัดไป</Link> : <span>ถัดไป</span>}
        </Button>
      </div>
    </div> : null}
  </div>;
}
