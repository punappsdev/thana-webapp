import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { notoSansThai, prompt } from "@/lib/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin | Thana Glass Group",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${prompt.variable} ${notoSansThai.variable} antialiased`}>
      <body className="min-h-screen bg-muted/40 text-foreground">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
