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
  const news = await prisma.news.findUnique({
    where: { slug, published: true },
  });

  if (!news) return {};

  const title = locale === "en" ? news.titleEn : news.titleTh;
  const description = locale === "en" ? news.excerptEn : news.excerptTh;

  return {
    title: `${title} | Thana Glass`,
    description: description || undefined,
    openGraph: {
      images: news.coverImage ? [news.coverImage] : [],
    },
  };
}

export default async function NewsDetailPage({ params }: DetailProps) {
  const { slug, locale } = await params;
  const t = await getTranslations("News");

  const news = await prisma.news.findUnique({
    where: { slug, published: true },
  });

  if (!news) {
    notFound();
  }

  const title = locale === "en" ? news.titleEn : news.titleTh;
  const content = locale === "en" ? news.contentEn : news.contentTh;
  const excerpt = locale === "en" ? news.excerptEn : news.excerptTh;

  const formattedDate = new Date(news.createdAt).toLocaleDateString(
    locale === "en" ? "en-US" : "th-TH",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      <Header />

      <main className="flex-1 pt-[72px] md:pt-[80px] pb-16">
        {/* News Detail Container */}
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
          {news.coverImage && (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#e2e2eb] shadow-blue-md border border-[#c4e2f5] mb-8">
              <Image
                src={news.coverImage}
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
                News
              </span>
              <span className="flex items-center gap-2 font-label-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                {t("publishedAt", { date: formattedDate })}
              </span>
            </div>

            <h1 className="font-headline-lg-mobile md:font-display-md font-bold text-on-surface leading-tight">
              {title}
            </h1>
          </div>

          {/* Meta action bar */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl border border-[#c4e2f5] shadow-blue-sm px-5 py-4 flex items-center justify-between gap-4">
              <span className="font-label-sm text-muted-foreground">
                Thana Glass Group Updates
              </span>
              <ShareButton label="Share" />
            </div>
          </div>

          {/* News Body Content */}
          <article className="relative bg-white rounded-2xl border border-[#c4e2f5] p-6 md:p-12 shadow-blue-sm overflow-hidden">
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
          </article>
        </div>
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}
