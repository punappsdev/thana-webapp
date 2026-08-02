import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { Partners } from "@/components/homepage/partners";
import Image from "next/image";
import { Building2, Sparkles, ShieldCheck, Layers, Trophy, Eye } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { alternatesFor, breadcrumbLd, metaDescription } from "@/lib/seo";
import type { Metadata } from "next";

interface Branch {
  name: string;
  desc: string;
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("AboutPage");
  return {
    title: t("title"),
    description: metaDescription(locale, t("metaDescription")),
    alternates: alternatesFor(locale, "/about"),
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("AboutPage");
  const tNav = await getTranslations("Header");
  const branches = t.raw("branches") as Branch[];

  const values = [
    { icon: ShieldCheck, key: "valueQuality" },
    { icon: Layers, key: "valueCraft" },
    { icon: Sparkles, key: "valueModern" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <JsonLd
        data={breadcrumbLd(locale, [{ name: t("title") }], tNav("nav.home"))}
      />
      <Header />

      <main className="flex-1 main-content-spacer">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-linear-to-br from-primary to-primary-container text-white">
          {/* Decorative dot grid */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Soft light wash */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="max-w-[1280px] mx-auto px-4 md:px-10 subpage-banner-padding relative z-10 animate-fade-in">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 font-label-sm font-medium tracking-wide backdrop-blur-md">
              <Building2 className="h-3.5 w-3.5" />
              {t("eyebrow")}
            </span>
            <h1 className="font-headline-lg-mobile md:font-display-md mt-5 mb-4 max-w-3xl">
              {t("title")}
            </h1>
            <p className="font-body-md md:font-body-lg max-w-4xl text-white/85 leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </section>

        {/* Group Overview Section */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-12 md:py-16">
          <div className="bg-white rounded-2xl border border-[#c4e2f5] p-6 md:p-10 shadow-blue-sm overflow-hidden relative">
            {/* Glassmorphic reflection */}
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
              {/* Left side: Logo Block */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="relative w-56 h-56 md:w-72 md:h-72 bg-[#001d35] rounded-2xl flex items-center justify-center p-8 shadow-blue-lg border border-primary-container/20 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 pointer-events-none" />
                  <Image
                    src="/main-logo-tp.png"
                    alt="Thana Glass Group Logo"
                    width={220}
                    height={220}
                    className="w-full h-auto object-contain brightness-0 invert"
                    style={{ width: '100%', height: 'auto' }}
                    priority
                  />
                </div>
              </div>

              {/* Right side: Text Block */}
              <div className="lg:col-span-8 flex flex-col gap-5">
                <span className="font-label-md font-semibold uppercase tracking-[0.18em] text-secondary">
                  {t("groupEyebrow")}
                </span>
                <h2 className="font-headline-lg md:font-display-md font-bold text-primary">
                  {t("groupTitle")}
                </h2>
                <p className="font-body-md md:font-body-lg text-muted-foreground leading-relaxed">
                  {t("groupDesc1")}
                </p>
                <p className="font-body-md md:font-body-lg text-muted-foreground leading-relaxed">
                  {t("groupDesc2")}
                </p>
              </div>
            </div>
          </div>

          {/* Value props row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
            {values.map(({ icon: Icon, key }, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-5 md:p-6 rounded-xl bg-[#faf8ff] border border-[#c4e2f5]/60"
              >
                <span className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-label-lg font-semibold text-foreground mb-1">
                    {t(`${key}Title`)}
                  </h3>
                  <p className="font-body-sm text-muted-foreground leading-relaxed">
                    {t(`${key}Desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Subsidiaries Grid Section */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-10 pb-16 md:pb-24">
          <div className="flex flex-col gap-2 mb-8 md:mb-12 max-w-2xl">
            <span className="font-label-md font-semibold uppercase tracking-[0.18em] text-secondary">
              {t("branchesEyebrow")}
            </span>
            <h2 className="font-headline-lg md:font-display-md font-bold text-primary mt-1">
              {t("branchesTitle")}
            </h2>
            <p className="font-body-md text-muted-foreground mt-2 leading-relaxed">
              {t("branchesIntro")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {branches.map((branch, idx) => (
              <article
                key={idx}
                className="group relative bg-white rounded-2xl border border-[#c4e2f5] p-6 md:p-8 shadow-blue-sm hover:shadow-blue-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Top accent bar */}
                <span className="absolute top-0 left-0 h-1 w-0 bg-linear-to-r from-[#078ee4] to-primary group-hover:w-full transition-all duration-500" />

                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-5">
                    <span className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-headline-sm font-bold">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <Building2 className="h-5 w-5 text-primary/30 group-hover:text-primary/60 transition-colors" />
                  </div>
                  <h3 className="font-headline-md font-bold text-primary mb-4 leading-snug group-hover:text-primary-container transition-colors">
                    {branch.name}
                  </h3>
                  <p className="font-body-sm text-muted-foreground leading-relaxed">
                    {branch.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-10 pb-16 md:pb-24">
          <div className="flex flex-col items-center text-center gap-3 mb-8 md:mb-12">
            <span className="font-label-md font-semibold uppercase tracking-[0.18em] text-secondary">
              {t("missionEyebrow")}
            </span>
            <h2 className="font-headline-lg md:font-display-md font-bold text-primary mt-2">
              {t("missionTitle")}
            </h2>
            <div className="w-16 h-1 bg-primary-container rounded-full mt-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Slogan Card */}
            <div className="bg-white rounded-2xl border border-[#c4e2f5] p-8 shadow-blue-sm hover:shadow-blue-md hover:border-primary/40 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-sky-100/60 text-sky-600 flex items-center justify-center mb-6">
                <Trophy className="h-8 w-8" />
              </div>
              <h3 className="font-headline-sm font-bold text-primary mb-3">
                {t("sloganTitle")}
              </h3>
              <p className="font-body-md text-muted-foreground leading-relaxed max-w-sm">
                {t("sloganDesc")}
              </p>
            </div>

            {/* Vision Card */}
            <div className="bg-white rounded-2xl border border-[#c4e2f5] p-8 shadow-blue-sm hover:shadow-blue-md hover:border-primary/40 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100/60 text-rose-600 flex items-center justify-center mb-6">
                <Eye className="h-8 w-8" />
              </div>
              <h3 className="font-headline-sm font-bold text-primary mb-3">
                {t("visionTitle")}
              </h3>
              <p className="font-body-md text-muted-foreground leading-relaxed max-w-sm font-noto-sans-thai">
                {t("visionDesc")}
              </p>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <Partners />
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}