import Link from "next/link";
import Image from "next/image";
import { Edit3, ImageOff, Plus } from "lucide-react";
import { DeletePopupButton } from "@/components/admin/delete-popup-button";
import { SetPopupLiveButton } from "@/components/admin/set-popup-live-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPopupList } from "@/lib/admin/popup-data";
import type { PopupFrequency, PromotionPopup } from "@/generated/prisma/client";

const frequencyLabels: Record<PopupFrequency, string> = {
  ALWAYS: "ทุกครั้ง",
  ONCE_PER_SESSION: "ครั้งเดียวต่อการเข้าเว็บ",
  ONCE_PER_DAY: "ครั้งเดียวต่อวัน",
};

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" });

function formatWindow(startDate: Date | null, endDate: Date | null): string {
  if (!startDate && !endDate) return "ไม่จำกัดช่วงเวลา";
  if (startDate && endDate) return `${dateFormatter.format(startDate)} – ${dateFormatter.format(endDate)}`;
  if (startDate) return `ตั้งแต่ ${dateFormatter.format(startDate)}`;
  return `ถึง ${dateFormatter.format(endDate!)}`;
}

/**
 * One plain-language answer per row to "ทำไมอันนี้ไม่ขึ้น" — the admin should
 * never have to compare dates and priority numbers in their head.
 */
type Availability = { label: string; variant: "default" | "secondary" | "outline"; note?: string };

function describe(item: PromotionPopup, now: Date, isLive: boolean): Availability {
  if (!item.published) return { label: "ฉบับร่าง", variant: "secondary", note: "ยังไม่เผยแพร่" };
  if (item.startDate && item.startDate > now) return { label: "รอถึงวันเริ่ม", variant: "outline", note: `เริ่ม ${dateFormatter.format(item.startDate)}` };
  if (item.endDate && item.endDate < now) return { label: "หมดเวลาแล้ว", variant: "outline", note: `สิ้นสุด ${dateFormatter.format(item.endDate)}` };
  if (isLive) return { label: "กำลังแสดง", variant: "default", note: "ผู้เข้าชมเห็นอันนี้" };
  return { label: "พร้อมแสดง", variant: "outline", note: "รอคิว — กดปุ่มเพื่อใช้อันนี้แทน" };
}

export default async function PopupListPage() {
  const popups = await getPopupList();
  const now = new Date();
  const isEligible = (item: PromotionPopup) =>
    item.published && (!item.startDate || item.startDate <= now) && (!item.endDate || item.endDate >= now);
  // getPopupList() is already sorted the way getActivePopup() picks, so the
  // first eligible row is exactly the one visitors are seeing.
  const liveId = popups.find(isEligible)?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline-lg font-semibold">Popup โปรโมชั่น</h1>
          <p className="font-body-sm text-muted-foreground mt-1">
            รูปโปรโมชั่นที่เด้งขึ้นมาเมื่อผู้เข้าชมเปิดหน้าแรก แสดงได้ทีละหนึ่งรายการ — ดูคอลัมน์ “สถานะ” ว่าตอนนี้อันไหนขึ้นอยู่ และกด “ใช้อันนี้” เพื่อสลับ
          </p>
        </div>
        <Button asChild><Link href="/admin/popups/new"><Plus className="size-4" />เพิ่ม Popup</Link></Button>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {popups.length ? (
            <Table className="w-full min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">รูป</TableHead>
                  <TableHead className="w-auto">ชื่อรายการ</TableHead>
                  <TableHead className="w-[210px]">สถานะ</TableHead>
                  <TableHead className="w-[220px]">ช่วงเวลา</TableHead>
                  <TableHead className="w-[180px]">ความถี่</TableHead>
                  <TableHead className="w-[140px] text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popups.map((item) => {
                  const status = describe(item, now, item.id === liveId);
                  return (
                  <TableRow key={item.id} className={item.id === liveId ? "bg-primary/5" : undefined}>
                    <TableCell>
                      <div className="relative h-14 w-12 overflow-hidden rounded-md border bg-muted">
                        {item.imageUrl
                          ? <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />
                          : <div className="flex h-full items-center justify-center"><ImageOff className="size-4 text-muted-foreground" /></div>}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <p className="font-label-md font-semibold">{item.name}</p>
                      <p className="font-body-sm text-muted-foreground">{item.linkUrl || "คลิกไม่ได้"}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {status.note ? <p className="font-body-sm text-muted-foreground mt-1">{status.note}</p> : null}
                    </TableCell>
                    <TableCell className="font-body-sm">{formatWindow(item.startDate, item.endDate)}</TableCell>
                    <TableCell className="font-body-sm">{frequencyLabels[item.frequency]}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {isEligible(item) && item.id !== liveId ? <SetPopupLiveButton id={item.id} name={item.name} /> : null}
                        <Button asChild variant="ghost" size="icon-sm">
                          <Link href={`/admin/popups/${item.id}`} aria-label={`แก้ไข ${item.name}`}><Edit3 className="size-4" /></Link>
                        </Button>
                        <DeletePopupButton id={item.id} name={item.name} published={item.published} />
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="py-12 text-center font-body-sm text-muted-foreground">ยังไม่มี Popup — กด “เพิ่ม Popup” เพื่อสร้างรายการแรก</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
