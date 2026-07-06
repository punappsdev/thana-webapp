import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Calendar, ChevronRight, ArrowLeft, Clock } from "lucide-react";
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
  const article = await prisma.article.findUnique({
    where: { slug, published: true },
  });

  if (!article) return {};

  const title = locale === "en" ? article.titleEn : article.titleTh;
  const description = locale === "en" ? article.excerptEn : article.excerptTh;

  return {
    title: `${title} | Thana Glass`,
    description: description || undefined,
    openGraph: {
      images: article.coverImage ? [article.coverImage] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: DetailProps) {
  const { slug, locale } = await params;
  const t = await getTranslations("Articles");

  const article = await prisma.article.findUnique({
    where: { slug, published: true },
    include: { category: true },
  });

  if (!article) {
    notFound();
  }

  const title = locale === "en" ? article.titleEn : article.titleTh;
  const content = locale === "en" ? article.contentEn : article.contentTh;
  const catName = article.category
    ? locale === "en"
      ? article.category.nameEn
      : article.category.nameTh
    : null;
  // Reserved for future multi-tag support — currently a single category
  const tags = catName ? [catName] : [];

  const formattedDate = new Date(article.createdAt).toLocaleDateString(
    locale === "en" ? "en-US" : "th-TH",
    { year: "numeric", month: "long", day: "numeric" }
  );

  // Estimate reading time (Thai/English avg ~ 200-250 wpm)
  const wordCount = content
    ? content
        .replace(/<[^>]+>/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 220));

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      <Header />

      <main className="flex-1 pt-[72px] md:pt-[80px] pb-16">
        {/* Article Hero */}
        <header className="relative overflow-hidden bg-linear-to-br from-primary to-primary-container text-white">
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

          <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-16 relative z-10 animate-fade-in">
            {/* Breadcrumb pill */}
            <nav className="mb-6">
              <div className="inline-flex items-center gap-2 font-label-sm text-white px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                <Link href="/" className="hover:text-white/80 transition-colors">
                  {t("home")}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-white/50" />
                <Link
                  href="/articles"
                  className="hover:text-white/80 transition-colors"
                >
                  {t("title")}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-white/50" />
                <span className="text-white/70 truncate max-w-[140px] md:max-w-xs">
                  {title}
                </span>
              </div>
            </nav>

            <h1 className="font-headline-lg-mobile md:font-display-md font-bold text-white leading-tight max-w-3xl mt-4">
              {title}
            </h1>
          </div>
        </header>

        {/* Cover Image — clear, full-bleed under the header */}
        {article.coverImage && (
          <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4 md:-mt-6 relative z-10">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#e2e2eb] shadow-blue-md border border-[#c4e2f5]">
              <Image
                src={article.coverImage}
                alt={title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {/* Meta bar */}
          <div className="mt-8 md:mt-10 mb-8">
            <div className="bg-white rounded-2xl border border-[#c4e2f5] shadow-blue-md px-5 md:px-7 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-3 min-w-0">
                {/* Tags — own line, reserved for multiple in the future */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center bg-[#c4e2f5] text-[#002c7d] px-3 py-1 rounded-md font-label-sm font-semibold tracking-wide"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* Date + reading time — separate line */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-label-md text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {t("readingTime", { minutes: readingTime })}
                  </span>
                </div>
              </div>
              <ShareButton label={t("share")} />
            </div>
          </div>

          {/* Article Body */}
          <article className="relative bg-white rounded-2xl border border-[#c4e2f5] p-6 md:p-12 shadow-blue-sm overflow-hidden">
            {/* Glassmorphic reflection overlay */}
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />

            {article.excerptEn && article.excerptTh && (
              <p className="relative z-10 font-body-lg text-primary/90 font-medium leading-relaxed border-l-4 border-primary-container pl-4 mb-8 italic">
                {locale === "en" ? article.excerptEn : article.excerptTh}
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

            {/* Footer Navigation */}
            <div className="relative z-10 border-t border-[#ededf7] pt-8 mt-12 flex items-center justify-between gap-4">
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 font-label-lg font-semibold text-primary hover:text-primary-container transition-all hover:-translate-x-0.5"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("back")}
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}