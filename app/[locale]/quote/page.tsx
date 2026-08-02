import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { getTranslations } from "next-intl/server";
import { MessageSquareQuote } from "lucide-react";
import { QuoteRequestForm } from "@/components/quote/quote-request-form";
import { alternatesFor, metaDescription } from "@/lib/seo";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("QuoteForm");
  return {
    title: t("metaTitle"),
    description: metaDescription(locale, t("metaDescription")),
    alternates: alternatesFor(locale, "/quote"),
  };
}

export default async function QuotePage({ params }: PageProps) {
  await params;
  const t = await getTranslations("QuoteForm");

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1 main-content-spacer">
        {/* Page Hero Header */}
        <section className="relative overflow-hidden bg-linear-to-br from-primary to-primary-container text-white">
          {/* Decorative dot grid */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Soft light wash */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="max-w-[1280px] mx-auto px-4 md:px-10 subpage-banner-padding-compact relative z-10 animate-fade-in">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 font-label-sm font-medium tracking-wide backdrop-blur-md">
              <MessageSquareQuote className="h-3.5 w-3.5" />
              {t("eyebrow")}
            </span>
            <h1 className="font-headline-lg-mobile md:font-display-md mt-5 mb-4 max-w-3xl font-bold leading-tight">
              {t("title")}
            </h1>
            <p className="font-body-md md:font-body-lg max-w-4xl text-white/85 leading-relaxed font-light">
              {t("description")}
            </p>
          </div>
        </section>

        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-12">
          <QuoteRequestForm />
        </div>
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}
