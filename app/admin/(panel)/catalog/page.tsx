import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATALOG_RESOURCES, catalogLabels } from "@/lib/admin/catalog-config";

export default function CatalogHubPage() {
  return <div className="space-y-6"><div><h1 className="font-headline-lg font-semibold">ข้อมูลแคตตาล็อก</h1><p className="font-body-sm text-muted-foreground">จัดการข้อมูลอ้างอิงที่ใช้ในสินค้าและบทความ</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{CATALOG_RESOURCES.map((resource) => <Link key={resource} href={`/admin/catalog/${resource}`}><Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-blue-md"><CardHeader><CardTitle className="flex items-center justify-between font-headline-sm"><span className="flex items-center gap-2"><Boxes className="size-5 text-primary" />{catalogLabels[resource]}</span><ArrowRight className="size-4" /></CardTitle></CardHeader><CardContent><p className="font-body-sm text-muted-foreground">ดู เพิ่ม แก้ไข และลบแบบตรวจสอบการอ้างอิง</p></CardContent></Card></Link>)}</div></div>;
}
