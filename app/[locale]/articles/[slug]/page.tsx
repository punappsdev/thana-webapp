import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Calendar, ChevronRight, ArrowLeft } from "lucide-react";
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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      <Header />

      <main className="flex-1 pt-[72px] md:pt-[80px] pb-16">
        {/* Breadcrumbs */}
        <nav className="bg-[#faf8ff] border-b border-[#c4e2f5]/60 py-4 px-4 md:px-10">
          <div className="max-w-4xl mx-auto flex items-center gap-2 font-label-sm text-[#434653]">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-[#747684]" />
            <Link href="/articles" className="hover:text-primary transition-colors">
              {t("title")}
            </Link>
            <ChevronRight className="h-4 w-4 text-[#747684]" />
            <span className="text-[#747684] truncate max-w-[180px] md:max-w-sm">
              {title}
            </span>
          </div>
        </nav>

        {/* Content Container */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-16">
          <article className="relative bg-white rounded-2xl border border-[#c4e2f5] p-6 md:p-12 shadow-blue-lg overflow-hidden">
            {/* Glassmorphic reflection overlay */}
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-8">
              {/* Article Header */}
              <div className="space-y-4">
                {catName && (
                  <span className="inline-block bg-primary/10 text-primary font-label-sm px-3.5 py-1 rounded-md font-semibold tracking-wide">
                    {catName}
                  </span>
                )}
                <h1 className="font-headline-lg-mobile md:font-display-md font-bold text-primary leading-tight">
                  {title}
                </h1>

                <div className="flex items-center gap-2 font-body-sm text-[#747684] border-b border-[#ededf7] pb-6">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    {t("publishedAt")}{" "}
                    {new Date(article.createdAt).toLocaleDateString(
                      locale === "en" ? "en-US" : "th-TH",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </span>
                </div>
              </div>

              {/* Large Cover Image */}
              {article.coverImage && (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#e2e2eb] shadow-blue-sm border border-[#c4e2f5]">
                  <Image
                    src={article.coverImage}
                    alt={title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1200px) 100vw, 900px"
                  />
                </div>
              )}

              {/* Article Body Content */}
              <div
                className="max-w-none text-muted-foreground leading-relaxed font-body-md space-y-6 
                           [&>p]:font-body-md [&>p]:leading-relaxed [&>p]:mb-4
                           [&>h3]:font-headline-md [&>h3]:font-bold [&>h3]:text-primary [&>h3]:mt-8 [&>h3]:mb-4 [&>h3]:border-l-4 [&>h3]:border-primary-container [&>h3]:pl-3
                           [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 [&>ol]:my-4 [&>ol>li]:font-body-md
                           [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ul]:my-4 [&>ul>li]:font-body-md
                           [&>strong]:text-foreground [&>strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: content }}
              />

              {/* Footer Navigation */}
              <div className="border-t border-[#ededf7] pt-8 mt-12">
                <Link
                  href="/articles"
                  className="inline-flex items-center gap-2 font-label-sm font-semibold text-primary hover:text-primary-container transition-all hover:-translate-x-0.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("back")}
                </Link>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}
