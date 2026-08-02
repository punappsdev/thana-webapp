import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { CartSheet } from "@/components/cart/cart-sheet";
import { notoSansThai, prompt } from "@/lib/fonts";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = {
  // Lets every page below return relative canonical/hreflang paths.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Thana Glass | กระจกนิรภัย กระจกอลูมิเนียม ภูเก็ต",
    template: `%s | ${SITE_NAME}`,
  },
  description: "High-end glass and aluminum installation services in Phuket",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
  },
};

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
