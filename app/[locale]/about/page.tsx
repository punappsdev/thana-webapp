import { getTranslations } from "next-intl/server";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowUpRight,
  Building2,
  Compass,
  Eye,
  Layers,
  MapPin,
  Phone,
  ShoppingCart,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LineIcon } from "@/components/icons/line-icon";

import { Partners } from "@/components/homepage/partners";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ContactFab } from "@/components/ui/contact-fab";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/json-ld";
import { alternatesFor, breadcrumbLd, metaDescription } from "@/lib/seo";

interface ContactItem {
  number: string;
  label: string;
}

interface CompanyContacts {
  address: string;
  line: string;
  office: string;
  sales: ContactItem[];
  accounting: string;
  purchasing: string;
  hr?: string;
}

interface Company {
  name: string;
  profile: string[];
  contacts: CompanyContacts;
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface ContactRowProps {
  icon: LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function lineHref(lineId: string) {
  const trimmed = lineId.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const clean = trimmed.replace(/^@/, "");
  return `https://line.me/R/ti/p/@${encodeURIComponent(clean)}`;
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  external = false,
}: ContactRowProps) {
  const valueContent = href ? (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      aria-label={`${label}: ${value}`}
      className="inline-flex max-w-full items-center gap-1 font-body-sm wrap-break-word text-primary underline-offset-4 transition-colors hover:text-secondary hover:underline"
    >
      <span className="wrap-break-word">{value}</span>
      {external ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
    </a>
  ) : (
    <span className="font-body-sm wrap-break-word text-foreground">{value}</span>
  );

  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-primary ring-1 ring-[#c4e2f5]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-label-sm uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <div className="mt-1">{valueContent}</div>
      </div>
    </div>
  );
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
  const companies = t.raw("companies") as Company[];

  const direction = [
    { icon: Eye, key: "vision", number: "01" },
    { icon: Compass, key: "mission", number: "02" },
    { icon: Layers, key: "businessType", number: "03" },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f9ff] text-foreground">
      <JsonLd
        data={breadcrumbLd(locale, [{ name: t("title") }], tNav("nav.home"))}
      />
      <Header />

      <main className="main-content-spacer flex-1">
        <section className="relative overflow-hidden bg-linear-to-br from-primary to-primary-container text-white">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 md:px-10 subpage-banner-padding relative z-10 animate-fade-in">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 font-label-sm font-medium tracking-wide backdrop-blur-md">
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
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

        <section className="relative overflow-hidden px-4 py-14 md:px-10 md:py-20">
          <div className="pointer-events-none absolute left-0 top-24 h-72 w-72 rounded-full bg-secondary-container/10 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <Card className="overflow-hidden rounded-lg border-[#c4e2f5] bg-white p-0! shadow-blue-lg ring-0">
              <div className="grid lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
                <div className="relative flex min-h-64 items-center justify-center overflow-hidden bg-[#001d35] p-8 md:min-h-80 md:p-12">
                  <div className="absolute inset-6 border border-white/20" />
                  <div className="absolute right-8 top-8 h-16 w-16 border-r border-t border-secondary-container/80" />
                  <div className="absolute bottom-8 left-8 h-16 w-16 border-b border-l border-secondary-container/80" />
                  <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent" />
                  <Image
                    src="/main-logo-tp.png"
                    alt={t("logoAlt")}
                    width={240}
                    height={240}
                    className="relative z-10 h-auto w-44 object-contain brightness-0 invert md:w-56"
                    priority
                  />
                </div>
                <div className="p-6 md:p-10 lg:p-12">
                  <p className="font-label-md uppercase tracking-[0.18em] text-secondary">
                    {t("groupEyebrow")}
                  </p>
                  <h2 className="mt-3 font-headline-lg-mobile text-primary md:font-display-md">
                    {t("groupTitle")}
                  </h2>
                  <div className="mt-6 space-y-4">
                    <p className="font-body-md text-muted-foreground md:font-body-lg">
                      {t("groupDesc1")}
                    </p>
                    <p className="font-body-md text-muted-foreground md:font-body-lg">
                      {t("groupDesc2")}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="border-y border-[#c4e2f5] bg-white/60 px-4 py-14 md:px-10 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-2xl md:mb-12">
              <p className="font-label-md uppercase tracking-[0.18em] text-secondary">
                {t("directionEyebrow")}
              </p>
              <h2 className="mt-3 font-headline-lg-mobile text-primary md:font-display-md">
                {t("directionTitle")}
              </h2>
              <p className="mt-4 font-body-md text-muted-foreground">
                {t("directionIntro")}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 md:gap-6">
              {direction.map(({ icon: Icon, key, number }) => (
                <Card
                  key={key}
                  className="group rounded-lg border-[#c4e2f5] bg-white/85 p-6! shadow-blue-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-blue-md md:p-7!"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="font-headline-sm text-primary/25">{number}</span>
                  </div>
                  <h3 className="mt-7 font-headline-md text-primary">
                    {t(`${key}Title`)}
                  </h3>
                  <p className="mt-3 font-body-md text-muted-foreground">
                    {t(`${key}Desc`)}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 md:px-10 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-3xl md:mb-14">
              <p className="font-label-md uppercase tracking-[0.18em] text-secondary">
                {t("companiesEyebrow")}
              </p>
              <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
                <h2 className="font-headline-lg-mobile text-primary md:font-display-md">
                  {t("companiesTitle")}
                </h2>
                <p className="max-w-xl font-body-md text-muted-foreground">
                  {t("companiesIntro")}
                </p>
              </div>
            </div>

            <div className="space-y-8 md:space-y-10">
              {companies.map((company, index) => {
                const isReversed = index % 2 === 1;
                const contacts = company.contacts;
                const contactRows = [
                  {
                    icon: MapPin,
                    label: t("contacts.address"),
                    value: contacts.address,
                  },
                  {
                    icon: LineIcon,
                    label: t("contacts.line"),
                    value: "Thanaglass",
                    href: lineHref(contacts.line),
                    external: true,
                  },
                  {
                    icon: Phone,
                    label: t("contacts.office"),
                    value: contacts.office,
                    href: phoneHref(contacts.office),
                  },
                  {
                    icon: Phone,
                    label: t("contacts.accounting"),
                    value: contacts.accounting,
                    href: phoneHref(contacts.accounting),
                  },
                  {
                    icon: ShoppingCart,
                    label: t("contacts.purchasing"),
                    value: contacts.purchasing,
                    href: phoneHref(contacts.purchasing),
                  },
                  ...(contacts.hr
                    ? [
                        {
                          icon: UsersRound,
                          label: t("contacts.hr"),
                          value: contacts.hr,
                          href: phoneHref(contacts.hr),
                        },
                      ]
                    : []),
                ];

                const salesMid = Math.ceil(contacts.sales.length / 2);
                const salesCol1 = contacts.sales.slice(0, salesMid);
                const salesCol2 = contacts.sales.slice(salesMid);

                return (
                  <Card
                    key={company.name}
                    className="overflow-hidden rounded-lg border-[#c4e2f5] bg-white p-0! shadow-blue-md ring-0"
                  >
                    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(21rem,0.78fr)]">
                      <div className={`p-6 md:p-10 lg:p-12 ${isReversed ? "lg:order-2" : ""}`}>
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-headline-sm text-white shadow-blue-sm">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-label-sm uppercase tracking-[0.16em] text-secondary">
                            {t("companyNumber", { number: String(index + 1).padStart(2, "0") })}
                          </span>
                        </div>
                        <h3 className="mt-6 max-w-2xl font-headline-md text-primary md:font-headline-lg">
                          {company.name}
                        </h3>
                        <div className="mt-7 border-l-2 border-secondary-container/50 pl-5 md:mt-8 md:pl-6">
                          <p className="font-label-md uppercase tracking-[0.14em] text-secondary">
                            {t("profileLabel")}
                          </p>
                          <div className="mt-4 space-y-5">
                            {company.profile.map((paragraph) => (
                              <p key={paragraph} className="font-body-md text-muted-foreground">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>

                      <aside
                        className={`bg-[#f3f9ff] p-6 md:p-10 lg:p-9 ${
                          isReversed
                            ? "lg:order-1 lg:border-r lg:border-[#c4e2f5]"
                            : "lg:border-l lg:border-[#c4e2f5]"
                        }`}
                      >
                        <div className="flex items-center gap-3 border-b border-[#c4e2f5] pb-5">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                            <Phone className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <h4 className="font-headline-sm text-primary">
                            {t("contactTitle")}
                          </h4>
                        </div>
                        <div className="mt-6 space-y-5">
                          {contactRows.map((row) => (
                            <ContactRow key={row.label} {...row} />
                          ))}
                        </div>
                        <div className="mt-7 border-t border-[#c4e2f5] pt-6">
                          <div className="mb-4 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-secondary" aria-hidden="true" />
                            <p className="font-label-md text-primary">{t("contacts.sales")}</p>
                          </div>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-4">
                              {salesCol1.map((sale) => (
                                <ContactRow
                                  key={sale.number}
                                  icon={Phone}
                                  label={sale.label}
                                  value={sale.number}
                                  href={phoneHref(sale.number)}
                                />
                              ))}
                            </div>
                            {salesCol2.length > 0 && (
                              <div className="space-y-4">
                                {salesCol2.map((sale) => (
                                  <ContactRow
                                    key={sale.number}
                                    icon={Phone}
                                    label={sale.label}
                                    value={sale.number}
                                    href={phoneHref(sale.number)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </aside>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <Partners locale={locale} />
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}
