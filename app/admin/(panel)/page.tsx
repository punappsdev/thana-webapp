import Link from "next/link";
import { ArrowRight, BookOpen, BriefcaseBusiness, FilePenLine, Package, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPrisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const prisma = getPrisma();
  const now = new Date();
  const [products, productDrafts, contentDrafts, activePromotions, activities] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { published: false } }),
    Promise.all([
      prisma.work.count({ where: { published: false } }),
      prisma.article.count({ where: { published: false } }),
      prisma.news.count({ where: { published: false } }),
      prisma.promotion.count({ where: { published: false } }),
    ]).then((counts) => counts.reduce((sum, count) => sum + count, 0)),
    prisma.promotion.count({ where: { published: true, OR: [{ endDate: null }, { endDate: { gte: now } }] } }),
    prisma.activityLog.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true } } } }),
  ]);

  const metrics = [
    { label: "สินค้าทั้งหมด", value: products, detail: `${productDrafts} ฉบับร่าง`, icon: Package },
    { label: "เนื้อหาฉบับร่าง", value: contentDrafts, detail: "ผลงาน, บทความ, ข่าว, โปรโมชั่น", icon: FilePenLine },
    { label: "โปรโมชั่นใช้งาน", value: activePromotions, detail: "เผยแพร่และยังไม่หมดอายุ", icon: Tags },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline-lg font-semibold">ภาพรวมระบบ</h1>
          <p className="mt-1 font-body-sm text-muted-foreground">ติดตามสถานะเนื้อหาและเข้าสู่งานที่ใช้บ่อย</p>
        </div>
        <Button asChild><Link href="/admin/products/new"><Package className="size-4" />เพิ่มสินค้า</Link></Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3" aria-label="สถิติเนื้อหา">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardDescription className="font-label-md">{metric.label}</CardDescription>
              <metric.icon className="size-5 text-primary" />
            </CardHeader>
            <CardContent><p className="font-display-md font-semibold text-primary">{metric.value}</p><p className="font-body-sm text-muted-foreground">{metric.detail}</p></CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader><CardTitle className="font-headline-sm">กิจกรรมล่าสุด</CardTitle><CardDescription className="font-body-sm">การเปลี่ยนแปลงล่าสุดในระบบ</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto">
            {activities.length ? (
              <Table><TableHeader><TableRow><TableHead>รายการ</TableHead><TableHead>การทำงาน</TableHead><TableHead>ผู้ดูแล</TableHead><TableHead>เวลา</TableHead></TableRow></TableHeader>
                <TableBody>{activities.map((activity) => <TableRow key={activity.id}><TableCell className="font-label-md">{activity.label || activity.entityType}</TableCell><TableCell><Badge variant="secondary">{activity.action}</Badge></TableCell><TableCell>{activity.admin?.name || "ระบบ"}</TableCell><TableCell>{activity.createdAt.toLocaleString("th-TH")}</TableCell></TableRow>)}</TableBody>
              </Table>
            ) : <p className="py-12 text-center font-body-sm text-muted-foreground">ยังไม่มีกิจกรรมในระบบ</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline-sm">สร้างเนื้อหาใหม่</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              ["บทความ", "/admin/content/articles/new", BookOpen],
              ["ผลงาน", "/admin/content/works/new", BriefcaseBusiness],
              ["โปรโมชั่น", "/admin/content/promotions/new", Tags],
            ].map(([label, href, Icon]) => (
              <Button key={String(href)} asChild variant="outline" className="w-full justify-between"><Link href={String(href)}><span className="flex items-center gap-2"><Icon className="size-4" />{String(label)}</span><ArrowRight className="size-4" /></Link></Button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
