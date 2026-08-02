import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { ContactMain } from "./contact-main";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/seo/json-ld";
import {
  alternatesFor,
  breadcrumbLd,
  metaDescription,
  organizationGraph,
  type BranchInfo,
} from "@/lib/seo";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("ContactPage");
  return {
    title: t("title"),
    description: metaDescription(locale, t("metaDescription")),
    alternates: alternatesFor(locale, "/contact"),
  };
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("ContactPage");
  const tNav = await getTranslations("Header");
  const tFooter = await getTranslations("Footer");

  // This page is where the branch addresses, phone numbers and map actually
  // live, so it carries the same business graph the homepage emits.
  const branches = t.raw("branches") as BranchInfo[];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <JsonLd data={organizationGraph(locale, branches, tFooter("desc"))} />
      <JsonLd
        data={breadcrumbLd(locale, [{ name: t("title") }], tNav("nav.home"))}
      />
      <Header />

      <ContactMain />

      <Footer />
      <ContactFab />
    </div>
  );
}
