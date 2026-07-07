import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Calendar, Megaphone, Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { UniversalSlider, SlideItem } from "@/components/ui/universal-slider";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CategoryFilter } from "@/components/ui/category-filter";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; page?: string }>;
}

export default async function NewsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { type = "all", page = "1" } = await searchParams;
  const pageNumber = parseInt(page, 10) || 1;
  const limit = 6;
  const skip = (pageNumber - 1) * limit;
  const t = await getTranslations("News");

  const now = new Date();

  // Fetch active promotions for the slider (always fetch all active promotions for the slider)
  const activePromotionsForSlider = await prisma.promotion.findMany({
    where: {
      published: true,
      OR: [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: null },
        { startDate: null, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: { gte: now } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch items for the grid list based on filters
  let newsList: any[] = [];
  let promotionsList: any[] = [];

  if (type === "all" || type === "news") {
    newsList = await prisma.news.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    });
  }

  if (type === "all" || type === "promotions") {
    // For promotions list in the grid, we show all published promotions (even those starting soon or expired, or only active? Let's show all published promotions)
    promotionsList = await prisma.promotion.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // Combine and sort by createdAt desc
  const allGridItems = [
    ...newsList.map((item) => ({ ...item, gridType: "news" as const })),
    ...promotionsList.map((item) => ({ ...item, gridType: "promotion" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalItems = allGridItems.length;
  const totalPages = Math.ceil(totalItems / limit);
  const sliderSlides: SlideItem[] = activePromotionsForSlider.map((promo) => ({
    id: promo.id,
    title: locale === "en" ? promo.titleEn : promo.titleTh,
    excerpt: locale === "en" ? promo.excerptEn : promo.excerptTh,
    tag: locale === "en" ? "Special Promotion" : "โปรโมชั่นพิเศษ",
    bgImage: promo.coverImage,
    link: `/promotions/${promo.slug}`,
    endDate: promo.endDate,
  }));

  const gridItems = allGridItems.slice(skip, skip + limit);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      <Header />

      <main className="flex-1 pt-[72px] md:pt-[80px]">
        {/* Top Active Promotions Slider Banner (Only visible if promotions exist) */}
        {activePromotionsForSlider.length > 0 && (
          <section className="relative w-full overflow-hidden select-none bg-primary mb-14 md:mb-16">
            <UniversalSlider
              slides={sliderSlides}
              locale={locale}
              showButtons={true}
              showTimer={true}
              heightClass="h-[400px] md:h-[480px]"
              roundedClass="rounded-none"
              shadowClass="shadow-none"
            />
          </section>
        )}

        {/* Unified Latest News & Promotions Section */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-10 pb-16 md:pb-24">
          {/* Section Header with Filter Controls */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end border-b border-[#ededf7] pb-6 mb-10">
            {/* Title & Subtitle */}
            <div className="space-y-2 border-l-4 border-primary pl-4">
              <h2 className="font-headline-lg-mobile md:font-headline-lg font-bold text-on-surface">
                {t("latestTitle")}
              </h2>
              <p className="font-body-sm text-muted-foreground font-light max-w-xl">
                {t("latestSubtitle")}
              </p>
            </div>

            {/* Filter Controls */}
            <CategoryFilter
              activeKey={type}
              items={[
                { key: "all", label: t("filterAll"), href: "/news?type=all" },
                { key: "news", label: t("filterNews"), href: "/news?type=news" },
                { key: "promotions", label: t("filterPromotions"), href: "/news?type=promotions" },
              ]}
            />
          </div>

          {/* Grid content */}
          {gridItems.length === 0 ? (
            <div className="text-center py-16 bg-[#ffffff] border border-[#c4e2f5] rounded-2xl shadow-blue-sm">
              <p className="text-[#434653] font-body-lg font-medium">
                {locale === "en" ? "No updates found." : "ไม่พบข้อมูลข่าวสารและโปรโมชั่นในขณะนี้"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridItems.map((item) => {
                const title = locale === "en" ? item.titleEn : item.titleTh;
                const excerpt = locale === "en" ? item.excerptEn : item.excerptTh;

                // News Card Layout
                if (item.gridType === "news") {
                  return (
                    <article
                      key={`news-${item.id}`}
                      className="group relative flex flex-col bg-white rounded-2xl border border-[#c4e2f5] shadow-blue-sm hover:shadow-blue-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                      {/* Accent top border */}
                      <span className="absolute top-0 left-0 h-1 w-0 bg-linear-to-r from-[#078ee4] to-primary group-hover:w-full transition-all duration-500" />

                      {/* Cover Image with News Overlay Badge */}
                      {item.coverImage && (
                        <div className="relative aspect-video w-full overflow-hidden bg-[#e2e2eb]">
                          <Image
                            src={item.coverImage}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          {/* Mockup matching tag badge overlay */}
                          <div className="absolute top-3 left-3 bg-primary text-white px-2.5 py-1 rounded-md font-label-sm font-bold uppercase tracking-wider shadow-sm z-10">
                            News
                          </div>
                        </div>
                      )}

                      {/* Content Area */}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div className="space-y-3">
                          {/* Date meta */}
                          <div className="flex items-center gap-1.5 font-label-sm text-[#747684]">
                            <Calendar className="h-3.5 w-3.5 text-secondary" />
                            <span>
                              {new Date(item.createdAt).toLocaleDateString(
                                locale === "en" ? "en-US" : "th-TH",
                                { year: "numeric", month: "short", day: "numeric" }
                              )}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-headline-sm font-bold text-on-surface line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            <Link href={`/news/${item.slug}`}>
                              {title}
                            </Link>
                          </h3>

                          {/* Excerpt */}
                          {excerpt && (
                            <p className="text-[#434653] font-body-sm line-clamp-3 leading-relaxed">
                              {excerpt}
                            </p>
                          )}
                        </div>

                        {/* Read News Link */}
                        <div className="pt-6 mt-auto">
                          <Link
                            href={`/news/${item.slug}`}
                            className="inline-flex items-center font-label-sm font-bold text-primary hover:text-primary-container transition-colors"
                          >
                            {t("readNews")} →
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                }

                // Promotion Card Layout (Mockup matching blue theme card)
                const hasEndDate = !!item.endDate;
                const formattedEndDate = item.endDate
                  ? new Date(item.endDate).toLocaleDateString(
                      locale === "en" ? "en-US" : "th-TH",
                      { year: "numeric", month: "short", day: "numeric" }
                    )
                  : "";

                return (
                  <article
                    key={`promo-${item.id}`}
                    className="group relative flex flex-col bg-white rounded-2xl border border-[#c4e2f5] shadow-blue-sm hover:shadow-blue-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    {/* Accent top border */}
                    <span className="absolute top-0 left-0 h-1 w-0 bg-linear-to-r from-[#078ee4] to-primary group-hover:w-full transition-all duration-500" />

                    {/* Cover Image with Promotion Overlay Badge */}
                    {item.coverImage && (
                      <div className="relative aspect-video w-full overflow-hidden bg-[#e2e2eb]">
                        <Image
                          src={item.coverImage}
                          alt={title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {/* Overlay badge matching news card style but using secondary brand color */}
                        <div className="absolute top-3 left-3 bg-secondary text-white px-2.5 py-1 rounded-md font-label-sm font-bold uppercase tracking-wider shadow-sm z-10">
                          Promotion
                        </div>
                      </div>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Date meta / Valid Until */}
                        <div className="flex items-center gap-1.5 font-label-sm text-[#747684]">
                          <Calendar className="h-3.5 w-3.5 text-secondary" />
                          <span>
                            {hasEndDate
                              ? t("validUntil", { date: formattedEndDate })
                              : new Date(item.createdAt).toLocaleDateString(
                                  locale === "en" ? "en-US" : "th-TH",
                                  { year: "numeric", month: "short", day: "numeric" }
                                )}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-headline-sm font-bold text-on-surface line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          <Link href={`/promotions/${item.slug}`}>
                            {title}
                          </Link>
                        </h3>

                        {/* Excerpt */}
                        {excerpt && (
                          <p className="text-[#434653] font-body-sm line-clamp-3 leading-relaxed">
                            {excerpt}
                          </p>
                        )}
                      </div>

                      {/* Read More / Book Link */}
                      <div className="pt-6 mt-auto">
                        <Link
                          href={`/promotions/${item.slug}`}
                          className="inline-flex items-center font-label-sm font-bold text-primary hover:text-primary-container transition-colors"
                        >
                          {t("readMore")} →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Pagination className="pt-12">
              <PaginationContent>
                {/* Previous Button */}
                <PaginationItem>
                  {pageNumber > 1 ? (
                    <PaginationPrevious
                      href={`/news?type=${type}&page=${pageNumber - 1}`}
                      label={t("prevPage")}
                    />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 h-9 font-semibold rounded-md border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed pointer-events-none">
                      <ChevronLeft className="h-4 w-4" />
                      <span>{t("prevPage")}</span>
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
                        href={`/news?type=${type}&page=${pNum}`}
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
                      href={`/news?type=${type}&page=${pageNumber + 1}`}
                      label={t("nextPage")}
                    />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 h-9 font-semibold rounded-md border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed pointer-events-none">
                      <span>{t("nextPage")}</span>
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </section>
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}
