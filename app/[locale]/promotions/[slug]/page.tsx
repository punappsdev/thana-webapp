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

  const title = locale === "en" ? promo.titleEn : promo.titleTh;
  const description = locale === "en" ? promo.excerptEn : promo.excerptTh;

  return {
    title: `${title} | Thana Glass`,
    description: description || undefined,
    openGraph: {
      images: promo.coverImage ? [promo.coverImage] : [],
    },
  };
}

export default async function PromotionDetailPage({ params }: DetailProps) {
  const { slug, locale } = await params;
  const t = await getTranslations("News");

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
      <Header />

      <main className="flex-1 pt-[72px] md:pt-[80px] pb-16">
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
                Promotion
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
                         [&>a]:text-secondary [&>a]:font-medium [&>a]:underline [&>a]:underline-offset-2 [&>a]:hover:text-primary
                         [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 [&>ol]:my-4 [&>ol>li]:font-body-md
                         [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ul]:my-4 [&>ul>li]:font-body-md
                         [&>strong]:text-foreground [&>strong]:font-semibold"
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
                  href="https://line.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-[#06C755] hover:bg-[#05b04b] text-white px-8 py-3.5 font-label-md font-bold rounded-full shadow-lg transition-transform hover:scale-105"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path d="M22 10.364c0-4.577-4.486-8.364-10-8.364s-10 3.787-10 8.364c0 4.1 3.568 7.525 8.389 8.217l-1.602 3.19c-.09.18.016.398.21.332l4.802-1.644c5.093-.244 8.201-3.647 8.201-8.455" />
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
