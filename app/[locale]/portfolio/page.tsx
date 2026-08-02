import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { PortfolioGrid, type PortfolioItem } from "@/components/portfolio/portfolio-grid";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CategoryFilter } from "@/components/ui/category-filter";
import { JsonLd } from "@/components/seo/json-ld";
import { alternatesFor, breadcrumbLd } from "@/lib/seo";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma/client";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; page?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const { category, page = "1" } = await searchParams;
  const t = await getTranslations("Portfolio");
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);

  const qs = new URLSearchParams();
  if (category) qs.set("category", category);
  if (pageNumber > 1) qs.set("page", String(pageNumber));
  const query = qs.toString();

  return {
    title: pageNumber > 1 ? `${t("title")} — ${pageNumber}` : t("title"),
    description: t("description"),
    alternates: alternatesFor(locale, query ? `/portfolio?${query}` : "/portfolio"),
  };
}

export default async function PortfolioPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { category, page = "1" } = await searchParams;
  const pageNumber = parseInt(page, 10) || 1;
  const limit = 6;
  const skip = (pageNumber - 1) * limit;

  const t = await getTranslations("Portfolio");
  const tNews = await getTranslations("News");
  const tNav = await getTranslations("Header");

  // Fetch categories — shared with products, so only show ones that
  // actually have a published work behind them
  const categories = await prisma.category.findMany({
    where: { published: true, works: { some: { published: true } } },
    orderBy: { sortOrder: "asc" },
  });

  // Build filter condition
  const where: Prisma.WorkWhereInput = { published: true };

  if (category) {
    where.category = { slug: category };
  }

  // Fetch all works matching condition (slice in memory)
  const allWorks = await prisma.work.findMany({
    where,
    include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const totalItems = allWorks.length;
  const totalPages = Math.ceil(totalItems / limit);

  // The cover doubles as the first slide, so viewers always open on the image
  // they just clicked — same treatment as the product page gallery.
  const works: PortfolioItem[] = allWorks.slice(skip, skip + limit).map((work) => {
    const title = locale === "en" ? work.titleEn : work.titleTh;
    const ordered = [
      ...(work.coverImage ? [{ url: work.coverImage, alt: title }] : []),
      ...work.images.map((image) => ({ url: image.url, alt: (locale === "en" ? image.altEn : image.altTh) || title })),
    ];
    // An admin may also add the cover to the gallery; show it once.
    const images = ordered.filter((image, index) => ordered.findIndex((other) => other.url === image.url) === index);

    return {
      id: work.id,
      title,
      description: locale === "en" ? work.descriptionEn : work.descriptionTh,
      categoryName: work.category ? (locale === "en" ? work.category.nameEn : work.category.nameTh) : null,
      // Falls back to the first gallery photo so a work without a cover still
      // shows something on the card instead of a text-only tile.
      coverImage: images[0]?.url ?? null,
      images,
    };
  });

  const activeCategory = category ? categories.find((c) => c.slug === category) : undefined;
  const breadcrumb = breadcrumbLd(
    locale,
    [
      { name: t("title"), ...(activeCategory ? { path: "/portfolio" } : {}) },
      ...(activeCategory
        ? [{ name: locale === "en" ? activeCategory.nameEn : activeCategory.nameTh }]
        : []),
    ],
    tNav("nav.home")
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <JsonLd data={breadcrumb} />
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
              <Sparkles className="h-3.5 w-3.5" />
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

        {/* Category Filter */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
          <div className="border-b border-[#ededf7] pb-6">
            <CategoryFilter
              activeKey={category || ""}
              items={[
                { key: "", label: t("all"), href: "/portfolio" },
                ...categories.map((cat) => ({
                  key: cat.slug,
                  label: locale === "en" ? cat.nameEn : cat.nameTh,
                  href: `/portfolio?category=${cat.slug}`,
                })),
              ]}
            />
          </div>
        </section>

        {/* Works Grid */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-10 pb-16 md:pb-24">
          {works.length === 0 ? (
            <div className="text-center py-16 bg-[#ffffff] border border-[#c4e2f5] rounded-2xl shadow-blue-sm">
              <p className="text-[#434653] font-body-lg font-medium">{t("noWorks")}</p>
            </div>
          ) : (
            <>
              <PortfolioGrid works={works} />

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Pagination className="pt-12">
                  <PaginationContent>
                    {/* Previous Button */}
                    <PaginationItem>
                      {pageNumber > 1 ? (
                        <PaginationPrevious
                          href={`/portfolio?category=${category || ""}&page=${pageNumber - 1}`}
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
                            href={`/portfolio?category=${category || ""}&page=${pNum}`}
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
                          href={`/portfolio?category=${category || ""}&page=${pageNumber + 1}`}
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
