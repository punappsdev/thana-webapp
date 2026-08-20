import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getMaintenanceText, type SiteSettings } from "@/lib/admin/site-settings";
import { SITE_NAME } from "@/lib/seo";

/**
 * หน้าปิดปรับปรุง — แสดงแทนเว็บสาธารณะทั้งหมดเมื่อเปิดโหมดจาก /admin/settings
 * ข้อความมาจากค่าใน `SiteSetting` ตาม locale และ fallback ไปยังข้อความเริ่มต้น
 * เมื่อแอดมินยังไม่ได้กรอก มีโลโก้บริษัทกลางจอ + สวิตช์ภาษา (ไทย/อังกฤษ) มุมบนขวา
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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-center">
      {/* แสงตกแต่งพื้นหลังด้วยสีแบรนด์ นุ่ม ๆ ไม่แย่งสายตาจากเนื้อหา */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary-container/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-secondary-container/10 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-40 w-40 rounded-full bg-accent blur-2xl" />
      </div>

      {/* สวิตช์ภาษา — มุมบนขวา */}
      <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-border bg-muted/80 p-1 backdrop-blur-sm sm:right-6 sm:top-6">
        <LocaleLink href="/" active={locale !== "en"}>
          ไทย
        </LocaleLink>
        <LocaleLink href="/en" active={locale === "en"}>
          English
        </LocaleLink>
      </div>

      <div className="relative flex max-w-xl flex-col items-center">
        {/* โลโก้บริษัท */}
        <Link href="/" aria-label={SITE_NAME}>
          <Image
            src="/main-logo-tp.png"
            alt={`${SITE_NAME} Logo`}
            width={200}
            height={65}
            className="h-12 w-auto object-contain sm:h-14"
            style={{ width: "auto" }}
            priority
          />
        </Link>

        <h1 className="mt-8 font-display-md font-semibold text-foreground">{title}</h1>
        <p className="mt-4 max-w-md font-body-md text-muted-foreground">{message}</p>

        <p className="mt-8 font-label-sm text-muted-foreground">{SITE_NAME}</p>
      </div>
    </main>
  );
}

function LocaleLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-5 py-1.5 font-label-md transition-colors ${
        active
          ? "bg-background font-semibold text-primary shadow-blue-sm"
          : "text-muted-foreground hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );
}
