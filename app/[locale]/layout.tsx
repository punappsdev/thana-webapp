import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { CartSheet } from "@/components/cart/cart-sheet";
import { ConsentManager } from "@/components/consent/consent-manager";
import { MaintenancePage } from "@/components/layout/maintenance-page";
import { getAdminSession } from "@/lib/admin/auth";
import { getSiteSettings } from "@/lib/admin/site-settings";
import { notoSansThai, prompt } from "@/lib/fonts";
import { SITE_NAME, SITE_URL, metaDescription } from "@/lib/seo";
import "../globals.css";

/**
 * Site-wide defaults. These only surface when a page returns no title or
 * description of its own, so they are resolved per locale rather than hard-coded
 * — an English fallback on a Thai URL is worse than no fallback at all.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Hero" });

  return {
    // Lets every page below return relative canonical/hreflang paths.
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("pageTitle"),
      template: `%s | ${SITE_NAME}`,
    },
    description: metaDescription(locale, t("metaDescription")),
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();
  const settings = await getSiteSettings();
  // เช็ก session เฉพาะเมื่อเปิดโหมดเท่านั้น ไม่ให้หน้าเว็บสาธารณะปกติเสีย query เพิ่ม
  const admin = settings.maintenanceMode ? await getAdminSession() : null;
  const underMaintenance = settings.maintenanceMode && !admin;

  return (
    <html
      lang={locale}
      className={`${prompt.variable} ${notoSansThai.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        {underMaintenance ? (
          <MaintenancePage locale={locale} settings={settings} />
        ) : (
          <NextIntlClientProvider messages={messages}>
            {children}
            <AnalyticsProvider />
            <ConsentManager />
            {/* Mounted once here so any page can open it via useCart().openCart() */}
            <CartSheet />
          </NextIntlClientProvider>
        )}
      </body>
    </html>
  );
}
