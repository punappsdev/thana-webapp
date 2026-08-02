import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { CartSheet } from "@/components/cart/cart-sheet";
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

  return (
    <html
      lang={locale}
      className={`${prompt.variable} ${notoSansThai.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          {children}
          {/* Mounted once here so any page can open it via useCart().openCart() */}
          <CartSheet />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
