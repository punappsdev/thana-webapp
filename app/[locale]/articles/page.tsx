import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Calendar, Search, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CategoryFilter } from "@/components/ui/category-filter";
import type { Prisma } from "@/generated/prisma/client";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; query?: string; page?: string }>;
}

export default async function ArticlesPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { category, query, page = "1" } = await searchParams;
  const pageNumber = parseInt(page, 10) || 1;
  const limit = 6;
  const skip = (pageNumber - 1) * limit;

  const t = await getTranslations("Articles");
  const tNews = await getTranslations("News");

  // Fetch categories
  const categories = await prisma.articleCategory.findMany({
    orderBy: { nameEn: "asc" },
  });

  // Build filter condition
  const where: Prisma.ArticleWhereInput = { published: true };

  if (category) {
    where.category = { slug: category };
  }

  if (query) {
    where.OR = [
      { titleTh: { contains: query } },
      { titleEn: { contains: query } },
      { excerptTh: { contains: query } },
      { excerptEn: { contains: query } },
    ];
  }

  // Fetch articles matching conditions (slice in memory)
  const allArticles = await prisma.article.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  const totalItems = allArticles.length;
  const totalPages = Math.ceil(totalItems / limit);
  const articles = allArticles.slice(skip, skip + limit);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1 main-content-spacer">
        {/* Page Hero Header */}
        <section className="relative overflow-hidden bg-linear-to-br from-primary to-primary-container text-white">
          {/* Decorative dot grid */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Soft light wash */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="max-w-[1280px] mx-auto px-4 md:px-10 subpage-banner-padding relative z-10 animate-fade-in">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 font-label-sm font-medium tracking-wide backdrop-blur-md">
              <BookOpen className="h-3.5 w-3.5" />
              {t("eyebrow")}
            </span>
            <h1 className="font-headline-lg-mobile md:font-display-md mt-5 mb-4 max-w-3xl font-bold leading-tight">
              {t("title")}
            </h1>
            <p className="font-body-md md:font-body-lg max-w-4xl text-white/85 leading-relaxed font-light">
              {t("description")}
            </p>
          </div>
        </section>

        {/* Filter Bar & Search */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center border-b border-[#ededf7] pb-6">
            {/* Category Filter */}
            <CategoryFilter
              activeKey={category || ""}
              items={[
                { key: "", label: t("all"), href: `/articles${query ? `?query=${query}` : ""}` },
                ...categories.map((cat) => ({
                  key: cat.slug,
                  label: locale === "en" ? cat.nameEn : cat.nameTh,
                  href: `/articles?category=${cat.slug}${query ? `&query=${query}` : ""}`,
                })),
              ]}
            />

            {/* Search Box */}
            <form method="GET" action="" className="relative w-full md:w-80">
              <input
                type="text"
                name="query"
                defaultValue={query || ""}
                placeholder={t("search")}
                className="w-full bg-[#ffffff] border border-[#c4e2f5] focus:border-primary focus:ring-1 focus:ring-primary rounded-md pl-10 pr-4 py-2 font-label-sm text-on-surface outline-none transition-all"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#747684]" />
              {category && <input type="hidden" name="category" value={category} />}
            </form>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-10 pb-16 md:pb-24">
          {articles.length === 0 ? (
            <div className="text-center py-16 bg-[#ffffff] border border-[#c4e2f5] rounded-2xl shadow-blue-sm">
              <p className="text-[#434653] font-body-lg font-medium">{t("noArticles")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article) => {
                  const title = locale === "en" ? article.titleEn : article.titleTh;
                  const excerpt = locale === "en" ? article.excerptEn : article.excerptTh;
                  const catName = article.category
                    ? locale === "en"
                      ? article.category.nameEn
                      : article.category.nameTh
                    : null;

                  return (
                    <article
                      key={article.id}
                      className="group relative flex flex-col bg-white rounded-2xl border border-[#c4e2f5] shadow-blue-sm hover:shadow-blue-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                      {/* Top accent bar */}
                      <span className="absolute top-0 left-0 h-1 w-0 bg-linear-to-r from-[#078ee4] to-primary group-hover:w-full transition-all duration-500" />

                      {/* Cover Image */}
                      {article.coverImage && (
                        <div className="relative aspect-video w-full overflow-hidden bg-[#e2e2eb]">
                          <Image
                            src={article.coverImage}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      )}

                      {/* Content Area */}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div className="space-y-3">
                          {/* Meta Tags */}
                          <div className="flex items-center gap-3 font-label-sm text-[#747684]">
                            {catName && (
                              <span className="bg-[#c4e2f5] text-[#002c7d] px-2.5 py-0.5 rounded-md font-medium">
                                {catName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(article.createdAt).toLocaleDateString(
                                locale === "en" ? "en-US" : "th-TH",
                                { year: "numeric", month: "short", day: "numeric" }
                              )}
                            </span>
                          </div>

                          {/* Title */}
                          <h2 className="font-headline-sm font-bold text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                            <Link href={`/articles/${article.slug}`}>
                              {title}
                            </Link>
                          </h2>

                          {/* Excerpt */}
                          {excerpt && (
                            <p className="text-[#434653] font-body-sm line-clamp-3">
                              {excerpt}
                            </p>
                          )}
                        </div>

                        {/* Read More Link */}
                        <div className="pt-6 mt-auto">
                          <Link
                            href={`/articles/${article.slug}`}
                            className="inline-flex items-center font-label-sm font-semibold text-primary hover:text-primary-container transition-colors"
                          >
                            {t("readMore")} →
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Pagination className="pt-12">
                  <PaginationContent>
                    {/* Previous Button */}
                    <PaginationItem>
                      {pageNumber > 1 ? (
                        <PaginationPrevious
                          href={`/articles?category=${category || ""}${
                            query ? `&query=${query}` : ""
                          }&page=${pageNumber - 1}`}
                          label={tNews("prevPage")}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-4 h-9 font-semibold rounded-md border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed pointer-events-none">
                          <ChevronLeft className="h-4 w-4" />
                          <span>{tNews("prevPage")}</span>
                        </span>
                      )}
                    </PaginationItem>

                    {/* Page links */}
                    {Array.from({ length: totalPages }, (_, idx) => {
                      const pNum = idx + 1;
                      const isCurrent = pNum === pageNumber;

                      return (
                        <PaginationItem key={pNum}>
                          <PaginationLink
                            href={`/articles?category=${category || ""}${
                              query ? `&query=${query}` : ""
                            }&page=${pNum}`}
                            isActive={isCurrent}
                          >
                            {pNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    {/* Next Button */}
                    <PaginationItem>
                      {pageNumber < totalPages ? (
                        <PaginationNext
                          href={`/articles?category=${category || ""}${
                            query ? `&query=${query}` : ""
                          }&page=${pageNumber + 1}`}
                          label={tNews("nextPage")}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-4 h-9 font-semibold rounded-md border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed pointer-events-none">
                          <span>{tNews("nextPage")}</span>
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      )}
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}
