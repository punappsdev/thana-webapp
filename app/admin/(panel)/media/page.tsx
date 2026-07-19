import Image from "next/image";
import Link from "next/link";
import { FileText, ImageIcon, Search } from "lucide-react";
import { MediaActions, MediaUpload } from "@/components/admin/media-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPrisma } from "@/lib/prisma";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ query?: string; page?: string }> }) {
  const filters = await searchParams;
  const page = Math.max(1, Number(filters.page) || 1);
  const take = 24;
  const where = filters.query ? { OR: [{ originalName: { contains: filters.query } }, { url: { contains: filters.query } }] } : {};
  const [assets, total] = await Promise.all([
    getPrisma().mediaAsset.findMany({ where, skip: (page - 1) * take, take, orderBy: { createdAt: "desc" } }),
    getPrisma().mediaAsset.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / take));

  return <div className="space-y-6">
    <div><h1 className="font-headline-lg font-semibold">คลังไฟล์</h1><p className="font-body-sm text-muted-foreground">JPG, PNG, WebP สูงสุด 10 MB และ PDF สูงสุด 25 MB · ทั้งหมด {total} ไฟล์</p></div>
    <Card><CardHeader><CardTitle className="font-headline-sm">อัปโหลดไฟล์ใหม่</CardTitle></CardHeader><CardContent><MediaUpload /></CardContent></Card>
    <Card><CardContent className="pt-6"><form className="flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="query" defaultValue={filters.query} placeholder="ค้นหาชื่อไฟล์หรือ URL" className="pl-9" /></div><Button type="submit" variant="outline">ค้นหา</Button></form></CardContent></Card>
    {assets.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{assets.map((asset) => <Card key={asset.id} className="overflow-hidden"><div className="relative flex aspect-video items-center justify-center bg-muted">{asset.kind === "IMAGE" ? <Image src={asset.url} alt={asset.originalName} fill className="object-cover" sizes="(max-width: 640px) 100vw, 25vw" /> : <FileText className="size-12 text-primary" />}</div><CardContent className="space-y-3 p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-label-md font-semibold" title={asset.originalName}>{asset.originalName}</p><p className="font-label-sm text-muted-foreground">{(asset.size / 1024 / 1024).toFixed(2)} MB</p></div><Badge variant="secondary">{asset.kind}</Badge></div><div className="flex items-center justify-between"><a href={asset.url} target="_blank" className="truncate font-label-sm text-primary hover:underline">เปิดไฟล์</a><MediaActions id={asset.id} url={asset.url} /></div></CardContent></Card>)}</div> : <Card><CardContent className="flex flex-col items-center py-16"><ImageIcon className="size-12 text-muted-foreground" /><p className="mt-4 font-body-sm text-muted-foreground">ไม่พบไฟล์</p></CardContent></Card>}
    <div className="flex items-center justify-between"><p className="font-body-sm text-muted-foreground">หน้า {page} จาก {totalPages}</p><div className="flex gap-2"><Button asChild variant="outline"><Link href={`?query=${encodeURIComponent(filters.query || "")}&page=${Math.max(1, page - 1)}`}>ก่อนหน้า</Link></Button><Button asChild variant="outline"><Link href={`?query=${encodeURIComponent(filters.query || "")}&page=${Math.min(totalPages, page + 1)}`}>ถัดไป</Link></Button></div></div>
  </div>;
}
