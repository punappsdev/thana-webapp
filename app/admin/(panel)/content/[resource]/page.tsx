import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit3, Eye, Plus, Search } from "lucide-react";
import { DeleteContentButton } from "@/components/admin/delete-content-button";
import { AdminSelect } from "@/components/admin/admin-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { contentConfigs, isContentResource } from "@/lib/admin/content-config";
import { getContentList } from "@/lib/admin/content-data";

export default async function ContentListPage({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ query?: string; status?: string; page?: string }> }) {
  const { resource } = await params;
  if (!isContentResource(resource)) notFound();
  const filters = await searchParams;
  const config = contentConfigs[resource];
  const result = await getContentList(resource, { query: filters.query, status: filters.status, page: Number(filters.page) || 1 });

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h1 className="font-headline-lg font-semibold">จัดการ{config.plural}</h1><p className="font-body-sm text-muted-foreground">ทั้งหมด {result.total} รายการ</p></div><Button asChild><Link href={`/admin/content/${resource}/new`}><Plus className="size-4" />เพิ่ม{config.singular}</Link></Button></div>
    <Card><CardContent className="pt-6"><form className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="query" defaultValue={filters.query} placeholder="ค้นหาชื่อหรือชื่อในลิงก์" className="pl-9 font-body-sm" /></div><AdminSelect name="status" defaultValue={filters.status || "all"} className="w-full md:w-48" options={[{ value: "all", label: "ทุกสถานะ" }, { value: "published", label: "เผยแพร่" }, { value: "draft", label: "ฉบับร่าง" }]} /><Button type="submit" variant="outline">ค้นหา</Button></form></CardContent></Card>
    <Card><CardContent className="overflow-x-auto p-0">{result.items.length ? <Table><TableHeader><TableRow><TableHead>ชื่อ</TableHead><TableHead>ชื่อในลิงก์ (URL)</TableHead><TableHead>สถานะ</TableHead><TableHead>แก้ไขล่าสุด</TableHead><TableHead className="text-right">จัดการ</TableHead></TableRow></TableHeader><TableBody>{result.items.map((item) => <TableRow key={item.id}><TableCell><p className="font-label-md font-semibold">{item.titleTh || "ยังไม่มีชื่อภาษาไทย"}</p><p className="font-body-sm text-muted-foreground">{item.titleEn || "ยังไม่มีชื่ออังกฤษ"}</p></TableCell><TableCell className="font-body-sm">{item.slug}</TableCell><TableCell><Badge variant={item.published ? "default" : "secondary"}>{item.published ? "เผยแพร่" : "ฉบับร่าง"}</Badge></TableCell><TableCell className="font-body-sm">{item.updatedAt.toLocaleString("th-TH")}</TableCell><TableCell><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon-sm"><Link href={`/admin/preview/${resource}/${item.id}?locale=th`} target="_blank" aria-label="Preview"><Eye className="size-4" /></Link></Button><Button asChild variant="ghost" size="icon-sm"><Link href={`/admin/content/${resource}/${item.id}`} aria-label="แก้ไข"><Edit3 className="size-4" /></Link></Button><DeleteContentButton resource={resource} id={item.id} title={item.titleTh} published={item.published} /></div></TableCell></TableRow>)}</TableBody></Table> : <p className="py-16 text-center font-body-sm text-muted-foreground">ไม่พบข้อมูล</p>}</CardContent></Card>
    <div className="flex items-center justify-between"><p className="font-body-sm text-muted-foreground">หน้า {result.page} จาก {result.totalPages}</p><div className="flex gap-2"><Button asChild variant="outline" disabled={result.page <= 1}><Link href={`?query=${encodeURIComponent(filters.query || "")}&status=${filters.status || "all"}&page=${Math.max(1, result.page - 1)}`}>ก่อนหน้า</Link></Button><Button asChild variant="outline" disabled={result.page >= result.totalPages}><Link href={`?query=${encodeURIComponent(filters.query || "")}&status=${filters.status || "all"}&page=${Math.min(result.totalPages, result.page + 1)}`}>ถัดไป</Link></Button></div></div>
  </div>;
}
