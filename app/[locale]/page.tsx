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
import { getActivePopup } from "@/lib/admin/popup-data";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import {
  SITE_LOGO,
  absoluteUrl,
  alternatesFor,
  organizationGraph,
  type BranchInfo,
} from "@/lib/seo";

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomeProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("Hero");
  const tFooter = await getTranslations("Footer");
  const title = t("pageTitle");
  const description = tFooter("desc");

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
  const popup = await getActivePopup();
  const t = await getTranslations("Hero");
  const tFooter = await getTranslations("Footer");
  const tContact = await getTranslations("ContactPage");

  const branches = tContact.raw("branches") as BranchInfo[];
  const organizationLd = organizationGraph(locale, branches, tFooter("desc"));

  return (
    <div className="flex flex-col min-h-screen bg-background">
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
