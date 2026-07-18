import type { Metadata } from "next";
import { Prompt, Noto_Sans_Thai } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { CartSheet } from "@/components/cart/cart-sheet";
import "../globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Thana Glass | กระจกนิรภัย กระจกอลูมิเนียม ภูเก็ต",
  description: "High-end glass and aluminum installation services in Phuket",
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
