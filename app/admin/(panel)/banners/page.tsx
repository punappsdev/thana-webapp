import Link from "next/link";
import Image from "next/image";
import { Edit3, ImageOff, Plus } from "lucide-react";
import { DeleteBannerButton } from "@/components/admin/delete-banner-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getHomepageBannerList } from "@/lib/admin/banner-data";

export default async function BannerListPage() {
  const banners = await getHomepageBannerList();

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h1 className="font-headline-lg font-semibold">แบนเนอร์หน้าแรก</h1><p className="font-body-sm text-muted-foreground">สไลด์ที่แสดงบนแบนเนอร์หน้าแรก ทั้งหมด {banners.length} รายการ</p></div><Button asChild><Link href="/admin/banners/new"><Plus className="size-4" />เพิ่มแบนเนอร์</Link></Button></div>
    <Card><CardContent className="overflow-x-auto p-0">{banners.length ? <Table><TableHeader><TableRow><TableHead>รูป</TableHead><TableHead>หัวข้อ</TableHead><TableHead>สถานะ</TableHead><TableHead>ลำดับ</TableHead><TableHead className="text-right">จัดการ</TableHead></TableRow></TableHeader><TableBody>{banners.map((item) => <TableRow key={item.id}><TableCell><div className="relative h-11 w-20 overflow-hidden rounded-md border bg-muted">{item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center"><ImageOff className="size-4 text-muted-foreground" /></div>}</div></TableCell><TableCell><p className="font-label-md font-semibold">{item.titleTh || "ยังไม่มีหัวข้อภาษาไทย"}</p><p className="font-body-sm text-muted-foreground">{item.titleEn || "ยังไม่มีหัวข้ออังกฤษ"}</p></TableCell><TableCell><Badge variant={item.published ? "default" : "secondary"}>{item.published ? "เผยแพร่" : "ฉบับร่าง"}</Badge></TableCell><TableCell className="font-body-sm">{item.sortOrder}</TableCell><TableCell><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon-sm"><Link href={`/admin/banners/${item.id}`} aria-label="แก้ไข"><Edit3 className="size-4" /></Link></Button><DeleteBannerButton id={item.id} title={item.titleTh} published={item.published} /></div></TableCell></TableRow>)}</TableBody></Table> : <p className="py-16 text-center font-body-sm text-muted-foreground">ยังไม่มีแบนเนอร์ กด “เพิ่มแบนเนอร์” เพื่อสร้างรายการแรก</p>}</CardContent></Card>
  </div>;
}
