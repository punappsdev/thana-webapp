import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPrisma } from "@/lib/prisma";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const take = 25;
  const [items, total] = await Promise.all([
    getPrisma().activityLog.findMany({ skip: (page - 1) * take, take, orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true, email: true } } } }),
    getPrisma().activityLog.count(),
  ]);
  return <div className="space-y-6"><div><h1 className="flex items-center gap-3 font-headline-lg font-semibold"><Activity className="size-7 text-primary" />บันทึกกิจกรรม</h1><p className="font-body-sm text-muted-foreground">ประวัติการเปลี่ยนแปลงทั้งหมด {total} รายการ</p></div><Card><CardHeader><CardTitle className="font-headline-sm">กิจกรรมล่าสุด</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0">{items.length ? <Table><TableHeader><TableRow><TableHead>เวลา</TableHead><TableHead>การทำงาน</TableHead><TableHead>รายการ</TableHead><TableHead>ผู้ดูแล</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell className="font-body-sm">{item.createdAt.toLocaleString("th-TH")}</TableCell><TableCell><Badge variant="secondary">{item.action}</Badge></TableCell><TableCell><p className="font-label-md">{item.label || item.entityType}</p><p className="font-label-sm text-muted-foreground">{item.entityType}{item.entityId ? ` #${item.entityId}` : ""}</p></TableCell><TableCell className="font-body-sm">{item.admin?.name || "ระบบ"}</TableCell></TableRow>)}</TableBody></Table> : <p className="py-16 text-center font-body-sm text-muted-foreground">ยังไม่มีกิจกรรม</p>}</CardContent></Card></div>;
}
