import { Wrench } from "lucide-react";
import { getMaintenanceText, type SiteSettings } from "@/lib/admin/site-settings";
import { SITE_NAME } from "@/lib/seo";

/**
 * หน้าปิดปรับปรุง — แสดงแทนเว็บสาธารณะทั้งหมดเมื่อเปิดโหมดจาก /admin/settings
 * ข้อความมาจากค่าใน `SiteSetting` ตาม locale และ fallback ไปยังข้อความเริ่มต้น
 * เมื่อแอดมินยังไม่ได้กรอก
 */
export function MaintenancePage({
  locale,
  settings,
}: {
  locale: string;
  settings: SiteSettings;
}) {
  const { title, message } = getMaintenanceText(settings, locale);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted">
        <Wrench className="size-7 text-primary" aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-display-md font-semibold text-foreground">{title}</h1>
      <p className="mt-4 max-w-md font-body-md text-muted-foreground">{message}</p>
      <p className="mt-10 font-label-sm text-muted-foreground">{SITE_NAME}</p>
    </main>
  );
}
