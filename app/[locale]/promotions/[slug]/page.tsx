import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Calendar, ArrowLeft } from "lucide-react";
import { ShareButton } from "@/components/ui/share-button";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import {
  SITE_URL,
  absoluteUrl,
  alternatesFor,
  breadcrumbLd,
  metaDescription,
} from "@/lib/seo";

interface DetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Generate dynamic SEO metadata
export async function generateMetadata({
  params,
}: DetailProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const promo = await prisma.promotion.findUnique({
    where: { slug, published: true },
  });

  if (!promo) return {};

  const t = await getTranslations("News");
  const title = locale === "en" ? promo.titleEn : promo.titleTh;
  // Excerpts are optional and unbounded in the schema — clamp what is there,
  // and build a line from the headline when it is missing.
  const description = metaDescription(
    locale,
    locale === "en" ? promo.excerptEn : promo.excerptTh,
    t("detailMetaDescription", { title })
  );

  return {
    // The layout's title template appends "| Thana Glass".
    title,
    description,
    alternates: alternatesFor(locale, `/promotions/${slug}`),
    openGraph: {
      title,
      description,
      type: "article",
      url: absoluteUrl(locale, `/promotions/${slug}`),
      images: promo.coverImage ? [`${SITE_URL}${promo.coverImage}`] : [],
    },
  };
}

export default async function PromotionDetailPage({ params }: DetailProps) {
  const { slug, locale } = await params;
  const t = await getTranslations("News");
  const tNav = await getTranslations("Header");

  const promo = await prisma.promotion.findUnique({
    where: { slug, published: true },
  });

  if (!promo) {
    notFound();
  }

  const title = locale === "en" ? promo.titleEn : promo.titleTh;
  const content = locale === "en" ? promo.contentEn : promo.contentTh;
  const excerpt = locale === "en" ? promo.excerptEn : promo.excerptTh;

  const formattedStartDate = promo.startDate
    ? new Date(promo.startDate).toLocaleDateString(
        locale === "en" ? "en-US" : "th-TH",
        { year: "numeric", month: "long", day: "numeric" }
      )
    : null;

  const formattedEndDate = promo.endDate
    ? new Date(promo.endDate).toLocaleDateString(
        locale === "en" ? "en-US" : "th-TH",
        { year: "numeric", month: "long", day: "numeric" }
      )
    : null;

  const now = new Date();
  const isExpired = promo.endDate ? new Date(promo.endDate) < now : false;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      <JsonLd
        data={breadcrumbLd(
          locale,
          [
            { name: t("title"), path: "/news" },
            { name: t("filterPromotions"), path: "/news?type=promotions" },
            { name: title },
          ],
          tNav("nav.home")
        )}
      />
      <Header />

      <main className="flex-1 main-content-spacer pb-16">
        {/* Promotion Detail Container */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8">
          {/* Back button */}
          <div className="mb-6">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 font-label-md font-semibold text-primary hover:text-primary-container transition-all hover:-translate-x-0.5"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToNews")}
            </Link>
          </div>

          {/* Cover Image */}
          {promo.coverImage && (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#e2e2eb] shadow-blue-md border border-[#c4e2f5] mb-8">
              <Image
                src={promo.coverImage}
                alt={title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>
          )}

          {/* Title & Metadata */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-[#c4e2f5] text-[#002c7d] px-3 py-1 rounded-md font-label-sm font-semibold tracking-wide">
                {t("badgePromotion")}
              </span>

              {formattedEndDate && (
                <span
                  className={`flex items-center gap-2 font-label-sm px-3 py-1 rounded-md font-medium border ${
                    isExpired
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-[#ededf7] text-primary border-[#c4e2f5]"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  {isExpired
                    ? locale === "en"
                      ? "Expired"
                      : "หมดเขตแล้ว"
                    : t("validUntil", { date: formattedEndDate })}
                </span>
              )}
            </div>

            <h1 className="font-headline-lg-mobile md:font-display-md font-bold text-on-surface leading-tight">
              {title}
            </h1>
          </div>

          {/* Meta action bar */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl border border-[#c4e2f5] shadow-blue-sm px-5 md:px-7 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-muted-foreground">
                  Thana Glass Group Campaign
                </span>
                {formattedStartDate && formattedEndDate && (
                  <span className="font-body-sm text-muted-foreground">
                    {formattedStartDate} - {formattedEndDate}
                  </span>
                )}
              </div>
              <ShareButton label="Share" />
            </div>
          </div>

          {/* Promotion Body Content */}
          <article className="relative bg-white rounded-2xl border border-[#c4e2f5] p-6 md:p-12 shadow-blue-sm overflow-hidden mb-8">
            {/* Crystalline background overlay */}
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />

            {excerpt && (
              <p className="relative z-10 font-body-lg text-primary/95 font-medium leading-relaxed border-l-4 border-primary-container pl-4 mb-8 italic">
                {excerpt}
              </p>
            )}

            <div
              className="relative z-10 max-w-none text-muted-foreground font-body-md
                         [&>p]:font-body-md [&>p]:leading-relaxed [&>p]:mb-4
                         [&>h2]:font-headline-md [&>h2]:font-bold [&>h2]:text-primary [&>h2]:mt-8 [&>h2]:mb-4
                         [&>h3]:font-headline-md [&>h3]:font-bold [&>h3]:text-primary [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:border-l-4 [&>h3]:border-primary-container [&>h3]:pl-3
                         [&>blockquote]:border-l-4 [&>blockquote]:border-primary-container [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-5
                         [&>img]:rounded-xl [&>img]:my-6 [&>img]:w-full [&>img]:object-cover
                         [&>p_img]:my-6
                         [&>hr]:my-8 [&>hr]:border-t [&>hr]:border-border
                         [&_a]:text-secondary [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-primary
                         [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 [&>ol]:my-4 [&>ol>li]:font-body-md
                         [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ul]:my-4 [&>ul>li]:font-body-md
                         [&_strong]:text-foreground [&_strong]:font-semibold
                         [&_em]:italic [&_u]:underline [&_u]:underline-offset-2 [&_s]:line-through"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* Line CTA Button */}
            {!isExpired && (
              <div className="mt-12 flex flex-col items-center justify-center p-6 bg-slate-50 border border-dashed border-border rounded-xl">
                <p className="font-body-md text-on-surface mb-4 text-center">
                  {locale === "en"
                    ? "Inquire about this promotion today with our specialists."
                    : "สนใจรับสิทธิ์โปรโมชั่นนี้? สามารถติดต่อสอบถามเจ้าหน้าที่ได้ทันที"}
                </p>
                <a
                  href="https://lin.ee/P3ZGgWM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-[#06C755] hover:bg-[#05b04b] text-white px-8 py-3.5 font-label-md font-bold rounded-full shadow-lg transition-transform hover:scale-105"
                >
                  <svg viewBox="0 0 30 30" fill="currentColor" className="h-8 w-8">
                    <path d="M 6 4 C 4.895 4 4 4.895 4 6 L 4 24 C 4 25.105 4.895 26 6 26 L 24 26 C 25.105 26 26 25.105 26 24 L 26 6 C 26 4.895 25.105 4 24 4 L 6 4 z M 15.003906 7.6660156 C 19.720906 7.6660156 23.558594 10.780375 23.558594 14.609375 C 23.558594 16.142375 22.964609 17.523813 21.724609 18.882812 C 19.929609 20.948812 15.916906 23.464609 15.003906 23.849609 C 14.091906 24.233609 14.225719 23.604672 14.261719 23.388672 C 14.283719 23.260672 14.384766 22.65625 14.384766 22.65625 C 14.413766 22.43725 14.442469 22.099812 14.355469 21.882812 C 14.258469 21.645813 13.880563 21.520937 13.601562 21.460938 C 9.4895625 20.916937 6.4472656 18.041375 6.4472656 14.609375 C 6.4472656 10.781375 10.286906 7.6660156 15.003906 7.6660156 z M 12.626953 12.910156 C 12.375953 12.910156 12.171875 13.107656 12.171875 13.347656 L 12.171875 16.652344 C 12.171875 16.894344 12.375953 17.089844 12.626953 17.089844 C 12.877953 17.089844 13.082031 16.893344 13.082031 16.652344 L 13.082031 13.347656 C 13.082031 13.107656 12.877953 12.910156 12.626953 12.910156 z M 14.5625 12.910156 C 14.5175 12.910156 14.470781 12.915641 14.425781 12.931641 C 14.248781 12.991641 14.128906 13.157703 14.128906 13.345703 L 14.128906 16.650391 C 14.128906 16.892391 14.3225 17.089844 14.5625 17.089844 C 14.8025 17.089844 14.996094 16.890391 14.996094 16.650391 L 14.996094 14.605469 L 16.679688 16.914062 C 16.760687 17.024063 16.889391 17.089844 17.025391 17.089844 C 17.072391 17.089844 17.118109 17.082406 17.162109 17.066406 C 17.340109 17.006406 17.460938 16.840344 17.460938 16.652344 L 17.457031 16.652344 L 17.457031 13.347656 C 17.457031 13.107656 17.263391 12.910156 17.025391 12.910156 C 16.787391 12.910156 16.591797 13.107656 16.591797 13.347656 L 16.591797 15.392578 L 14.908203 13.085938 C 14.827203 12.975938 14.6985 12.910156 14.5625 12.910156 z M 18.929688 12.910156 C 18.678688 12.910156 18.474609 13.107656 18.474609 13.347656 L 18.474609 14.998047 L 18.474609 15 L 18.474609 16.650391 C 18.474609 16.892391 18.678687 17.089844 18.929688 17.089844 L 20.654297 17.089844 C 20.906297 17.089844 21.111328 16.892344 21.111328 16.652344 C 21.111328 16.412344 20.905297 16.216797 20.654297 16.216797 L 19.384766 16.216797 L 19.384766 15.435547 L 20.654297 15.435547 C 20.906297 15.435547 21.111328 15.24 21.111328 15 C 21.111328 14.758 20.905297 14.5625 20.654297 14.5625 L 19.384766 14.564453 L 19.384766 13.783203 L 20.654297 13.783203 C 20.906297 13.783203 21.111328 13.588656 21.111328 13.347656 C 21.111328 13.107656 20.905297 12.910156 20.654297 12.910156 L 18.929688 12.910156 z M 9.34375 12.912109 C 9.09275 12.912109 8.8886719 13.106656 8.8886719 13.347656 L 8.8886719 16.652344 C 8.8886719 16.894344 9.09275 17.089844 9.34375 17.089844 L 11.068359 17.089844 C 11.320359 17.089844 11.522438 16.893297 11.523438 16.654297 C 11.523437 16.414297 11.319359 16.21875 11.068359 16.21875 L 9.7988281 16.21875 L 9.7988281 13.347656 C 9.7988281 13.107656 9.59475 12.912109 9.34375 12.912109 z" />
                  </svg>
                  {t("contactLine")}
                </a>
              </div>
            )}
          </article>
        </div>
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}
