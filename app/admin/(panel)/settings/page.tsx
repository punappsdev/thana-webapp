import { Suspense } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LineQuotaCard } from "@/components/admin/line-quota-card";
import { LineRoutingCard } from "@/components/admin/line-routing-card";
import { MaintenanceModeToggle } from "@/components/admin/maintenance-mode-toggle";
import { MaintenanceTextForm } from "@/components/admin/maintenance-text-form";
import { MourningModeToggle } from "@/components/admin/mourning-mode-toggle";
import { StorageCard } from "@/components/admin/storage-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdminPage } from "@/lib/admin/auth";
import { getSiteSettings } from "@/lib/admin/site-settings";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" });

export default async function SiteSettingsPage() {
  // getSiteSettings also feeds the public homepage, so it cannot carry the
  // check itself.
  await requireAdminPage();
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline-lg font-semibold">ตั้งค่าเว็บไซต์</h1>
          <p className="font-body-sm text-muted-foreground mt-1">
            กำหนดค่าการแสดงผลทั่วไปที่มีผลครอบคลุมทั่วทั้งเว็บไซต์ การปรับเปลี่ยนจะมีผลต่อผู้เข้าชมทันที
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/" target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
            ดูหน้าแรก
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>โหมดไว้อาลัย</CardTitle>
          <CardDescription>
            ปรับหน้าแรกให้เป็นโทนขาวดำเพื่อร่วมไว้อาลัย
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <MourningModeToggle enabled={settings.mourningMode} />
          {settings.updatedAt ? (
            <p className="font-body-sm text-muted-foreground">
              แก้ไขล่าสุด {dateFormatter.format(settings.updatedAt)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>โหมดปิดปรับปรุงเว็บไซต์</CardTitle>
          <CardDescription>
            แสดงหน้าปิดปรับปรุงแทนเว็บสาธารณะทั้งหมด เหมาะช่วงตั้งค่าหลังบ้านหรืออัปเดตเว็บ
            แอดมินที่ล็อกอินอยู่ยังเห็นเว็บจริงเพื่อตรวจงานก่อนเปิดให้ลูกค้า
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MaintenanceModeToggle enabled={settings.maintenanceMode} />
          <MaintenanceTextForm settings={settings} />
        </CardContent>
      </Card>

      {/* อ่านพื้นที่ว่างของไดรฟ์และรวมขนาดไฟล์จากฐานข้อมูล เร็วแต่แยก stream ไว้เหมือนกัน */}
      <Suspense fallback={<StorageCardSkeleton />}>
        <StorageCard />
      </Suspense>

      {/* LINE API ช้าหรือ timeout ได้ถึง 10 วินาที กันไม่ให้ไปหน่วงการ์ดอื่นทั้งหน้า */}
      <Suspense fallback={<LineQuotaCardSkeleton />}>
        <LineQuotaCard />
      </Suspense>

      <Suspense fallback={<LineRoutingCardSkeleton />}>
        <LineRoutingCard />
      </Suspense>
    </div>
  );
}

function StorageCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>พื้นที่จัดเก็บไฟล์</CardTitle>
        <CardDescription>กำลังตรวจสอบพื้นที่ของไดรฟ์...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-5 w-64" />
      </CardContent>
    </Card>
  );
}

function LineQuotaCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>โควต้าข้อความ LINE</CardTitle>
        <CardDescription>กำลังอ่านโควต้าจาก LINE...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-5 w-64" />
      </CardContent>
    </Card>
  );
}

function LineRoutingCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>กฎการส่งแจ้งเตือนกลุ่มไลน์ทีมขาย</CardTitle>
        <CardDescription>กำลังอ่านกฎที่ตั้งไว้...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-9 w-40" />
      </CardContent>
    </Card>
  );
}
