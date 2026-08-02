import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { MourningModeToggle } from "@/components/admin/mourning-mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/admin/site-settings";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" });

export default async function SiteSettingsPage() {
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
    </div>
  );
}
