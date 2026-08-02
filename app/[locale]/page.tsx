import { Header } from "@/components/layout/header";
import { Hero } from "@/components/homepage/hero";
import { CategoryGrid } from "@/components/homepage/category-grid";
import { ProductList } from "@/components/homepage/product-list";
import { QuotationSteps } from "@/components/homepage/quotation-steps";
import { AboutUs } from "@/components/homepage/about-us";
import { Partners } from "@/components/homepage/partners";
import { CtaSection } from "@/components/homepage/cta-section";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { PromotionPopup } from "@/components/promotion/promotion-popup";
import { MourningTone } from "@/components/layout/mourning-tone";
import { getActivePopup } from "@/lib/admin/popup-data";
import { getSiteSettings } from "@/lib/admin/site-settings";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import {
  SITE_LOGO,
  absoluteUrl,
  alternatesFor,
  metaDescription,
  organizationGraph,
  type BranchInfo,
} from "@/lib/seo";

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomeProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("Hero");
  const title = t("pageTitle");
  // Deliberately not the footer blurb: that copy is written to be read on the
  // page, and at ~110 characters it leaves a third of the snippet empty.
  const description = metaDescription(locale, t("metaDescription"));

  return {
    // `absolute` skips the layout's "| Thana Glass" template — the homepage
    // title already carries the brand.
    title: { absolute: title },
    description,
    alternates: alternatesFor(locale, "/"),
    openGraph: {
      title,
      description,
      url: absoluteUrl(locale, "/"),
      images: [SITE_LOGO],
    },
  };
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const [popup, settings] = await Promise.all([getActivePopup(), getSiteSettings()]);
  const t = await getTranslations("Hero");
  const tFooter = await getTranslations("Footer");
  const tContact = await getTranslations("ContactPage");

  const branches = tContact.raw("branches") as BranchInfo[];
  const organizationLd = organizationGraph(locale, branches, tFooter("desc"));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {settings.mourningMode ? <MourningTone /> : null}
      <JsonLd data={organizationLd} />
      <Header />
      
      {/* Main Content Spacer to adjust for fixed Header height */}
      <main className="flex-1 main-content-spacer">
        {/* The visual lead-in is a rotating banner, so the page's single H1
            lives here for screen readers and search engines instead. */}
        <h1 className="sr-only">{t("pageTitle")}</h1>
        <Hero locale={locale} />
        <CategoryGrid locale={locale} />
        <ProductList locale={locale} />
        <QuotationSteps />
        <AboutUs />
        <Partners />
        <CtaSection />
      </main>

      <Footer />
      <ContactFab />
      {popup ? <PromotionPopup popup={popup} locale={locale} /> : null}
    </div>
  );
}
