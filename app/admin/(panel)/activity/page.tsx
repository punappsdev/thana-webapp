import Link from "next/link";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { activityActionLabel, activityActionVariant, entityTypeLabel } from "@/lib/admin/activity-labels";
import { requireAdminPage } from "@/lib/admin/auth";
import { getPrisma } from "@/lib/prisma";

const PAGE_SIZE = 25;

/** Pages to render around `current`: first, a small window, and last, with ellipsis gaps. */
function pageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  // Queried straight off Prisma rather than through a guarded lib/admin/*-data
  // module, so the check has to live here.
  await requireAdminPage();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [items, total] = await Promise.all([
    getPrisma().activityLog.findMany({ skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true, email: true } } } }),
    getPrisma().activityLog.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-headline-lg font-semibold">
          <Activity className="size-7 text-primary" />
          บันทึกกิจกรรม
        </h1>
        <p className="font-body-sm text-muted-foreground">ประวัติการเปลี่ยนแปลงทั้งหมด {total} รายการ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline-sm">กิจกรรมล่าสุด</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เวลา</TableHead>
                    <TableHead>การทำงาน</TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead>ผู้ดูแล</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-body-sm">{item.createdAt.toLocaleString("th-TH")}</TableCell>
                      <TableCell>
                        <Badge variant={activityActionVariant(item.action)}>{activityActionLabel(item.action)}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-label-md">{item.label || entityTypeLabel(item.entityType)}</p>
                        <p className="font-label-sm text-muted-foreground">
                          {entityTypeLabel(item.entityType)}
                          {item.entityId ? ` #${item.entityId}` : ""}
                        </p>
                      </TableCell>
                      <TableCell className="font-body-sm">{item.admin?.name || "ระบบ"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-16 text-center font-body-sm text-muted-foreground">ยังไม่มีกิจกรรม</p>
          )}

          {totalPages > 1 && (
            <nav aria-label="การแบ่งหน้า" className="flex items-center justify-center gap-1.5 border-t p-4">
              {page > 1 ? (
                <Button asChild variant="outline">
                  <Link href={`/admin/activity?page=${page - 1}`}>
                    <ChevronLeft className="size-4" />
                    ก่อนหน้า
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  <ChevronLeft className="size-4" />
                  ก่อนหน้า
                </Button>
              )}

              {pageList(page, totalPages).map((p, idx) =>
                p === "ellipsis" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 font-body-sm text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    asChild
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    aria-current={p === page ? "page" : undefined}
                  >
                    <Link href={`/admin/activity?page=${p}`}>{p}</Link>
                  </Button>
                )
              )}

              {page < totalPages ? (
                <Button asChild variant="outline">
                  <Link href={`/admin/activity?page=${page + 1}`}>
                    ถัดไป
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  ถัดไป
                  <ChevronRight className="size-4" />
                </Button>
              )}
            </nav>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
