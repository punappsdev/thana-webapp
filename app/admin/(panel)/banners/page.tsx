import Link from "next/link";
import Image from "next/image";
import { Edit3, ImageOff, Plus } from "lucide-react";
import { DeleteBannerButton } from "@/components/admin/delete-banner-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBannerList } from "@/lib/admin/banner-data";
import type { Banner } from "@/generated/prisma/client";

function BannerTable({ items, emptyLabel }: { items: Banner[]; emptyLabel: string }) {
  if (!items.length) return <p className="py-12 text-center font-body-sm text-muted-foreground">{emptyLabel}</p>;
  return <Table>
    <TableHeader><TableRow><TableHead>รูป</TableHead><TableHead>หัวข้อ</TableHead><TableHead>สถานะ</TableHead><TableHead>ลำดับ</TableHead><TableHead className="text-right">จัดการ</TableHead></TableRow></TableHeader>
    <TableBody>{items.map((item) => <TableRow key={item.id}>
      <TableCell><div className="relative h-11 w-20 overflow-hidden rounded-md border bg-muted">{item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center"><ImageOff className="size-4 text-muted-foreground" /></div>}</div></TableCell>
      <TableCell><p className="font-label-md font-semibold">{item.titleTh || "ยังไม่มีหัวข้อภาษาไทย"}</p><p className="font-body-sm text-muted-foreground">{item.titleEn || "ยังไม่มีหัวข้ออังกฤษ"}</p></TableCell>
      <TableCell><Badge variant={item.published ? "default" : "secondary"}>{item.published ? "เผยแพร่" : "ฉบับร่าง"}</Badge></TableCell>
      <TableCell className="font-body-sm">{item.sortOrder}</TableCell>
      <TableCell><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon-sm"><Link href={`/admin/banners/${item.id}`} aria-label="แก้ไข"><Edit3 className="size-4" /></Link></Button><DeleteBannerButton id={item.id} title={item.titleTh} published={item.published} /></div></TableCell>
    </TableRow>)}</TableBody>
  </Table>;
}

export default async function BannerListPage() {
  const [homepageBanners, promotionBanners] = await Promise.all([getBannerList("HOMEPAGE"), getBannerList("PROMOTION")]);

  return <div className="space-y-8">
    <div><h1 className="font-headline-lg font-semibold">แบนเนอร์</h1><p className="font-body-sm text-muted-foreground">จัดการแบนเนอร์หน้าแรกและแบนเนอร์โปรโมชั่นที่แสดงบนเว็บไซต์</p></div>

    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4"><div><h2 className="font-headline-sm font-semibold">แบนเนอร์หน้าแรก</h2><p className="font-body-sm text-muted-foreground">สไลด์บนแบนเนอร์หน้าแรก ทั้งหมด {homepageBanners.length} รายการ</p></div><Button asChild><Link href="/admin/banners/new?type=homepage"><Plus className="size-4" />เพิ่มแบนเนอร์หน้าแรก</Link></Button></div>
      <Card><CardContent className="overflow-x-auto p-0"><BannerTable items={homepageBanners} emptyLabel="ยังไม่มีแบนเนอร์หน้าแรก" /></CardContent></Card>
    </section>

    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4"><div><h2 className="font-headline-sm font-semibold">แบนเนอร์โปรโมชั่น</h2><p className="font-body-sm text-muted-foreground">สไลด์โปรโมชั่นบนหน้าข่าว/โปรโมชั่น ทั้งหมด {promotionBanners.length} รายการ</p></div><Button asChild><Link href="/admin/banners/new?type=promotion"><Plus className="size-4" />เพิ่มแบนเนอร์โปรโมชั่น</Link></Button></div>
      <Card><CardContent className="overflow-x-auto p-0"><BannerTable items={promotionBanners} emptyLabel="ยังไม่มีแบนเนอร์โปรโมชั่น" /></CardContent></Card>
    </section>
  </div>;
}
