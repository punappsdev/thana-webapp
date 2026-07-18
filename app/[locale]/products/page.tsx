import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { prisma } from "@/lib/prisma";
import { formatPrice, pick, priceRange } from "@/lib/products";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Package, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
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
import type { Prisma } from "../../../generated/prisma/client";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; sub?: string; page?: string }>;
}

const PAGE_SIZE = 9;

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { category, sub, page = "1" } = await searchParams;
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);

  const t = await getTranslations("Products");
  const tNews = await getTranslations("News");

  // Only surface categories that actually have a published product behind them
  const categories = await prisma.category.findMany({
    where: { published: true, products: { some: { published: true } } },
    orderBy: { sortOrder: "asc" },
    include: {
      subCategories: {
        where: { published: true, products: { some: { published: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const activeCategory = category ? categories.find((c) => c.slug === category) : undefined;
  // A sub-category filter only applies while its parent category is selected
  const activeSub =
    activeCategory && sub
      ? activeCategory.subCategories.find((s) => s.slug === sub)
      : undefined;

  const where: Prisma.ProductWhereInput = {
    published: true,
    ...(activeCategory ? { categoryId: activeCategory.id } : {}),
    ...(activeSub ? { subCategoryId: activeSub.id } : {}),
  };

  // Count and page at the database level rather than slicing in memory
  const [totalItems, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        category: true,
        subCategory: true,
        brand: true,
        pricingUnit: true,
        variants: { select: { price: true } },
      },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (pageNumber - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  // Preserve the active filters when moving between pages
  const buildHref = (opts: { category?: string; sub?: string; page?: number }) => {
    const qs = new URLSearchParams();
    const nextCategory = opts.category ?? activeCategory?.slug ?? "";
    const nextSub = opts.sub ?? "";
    if (nextCategory) qs.set("category", nextCategory);
    if (nextSub) qs.set("sub", nextSub);
    if (opts.page && opts.page > 1) qs.set("page", String(opts.page));
    const q = qs.toString();
    return q ? `/products?${q}` : "/products";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1 pt-[72px] md:pt-[80px]">
        {/* Page Hero Header */}
        <section className="relative overflow-hidden bg-linear-to-br from-primary to-primary-container text-white">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-12 md:py-20 relative z-10 animate-fade-in">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 font-label-sm font-medium tracking-wide backdrop-blur-md">
              <Package className="h-3.5 w-3.5" />
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

        {/* Category + sub-category filters */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
          <div className="border-b border-[#ededf7] pb-6 space-y-4">
            <CategoryFilter
              activeKey={activeCategory?.slug ?? ""}
              items={[
                { key: "", label: t("all"), href: "/products" },
                ...categories.map((cat) => ({
                  key: cat.slug,
                  label: pick(cat, "name", locale),
                  href: buildHref({ category: cat.slug }),
                })),
              ]}
            />

            {/* Sub-categories appear only once a parent category is chosen */}
            {activeCategory && activeCategory.subCategories.length > 0 && (
              <div className="pt-1">
                <CategoryFilter
                  activeKey={activeSub?.slug ?? ""}
                  items={[
                    {
                      key: "",
                      label: t("allSubCategories"),
                      href: buildHref({ category: activeCategory.slug }),
                    },
                    ...activeCategory.subCategories.map((s) => ({
                      key: s.slug,
                      label: pick(s, "name", locale),
                      href: buildHref({ category: activeCategory.slug, sub: s.slug }),
                    })),
                  ]}
                />
              </div>
            )}

            {totalItems > 0 && (
              <p className="font-label-sm text-[#434653]">
                {t("resultCount", { count: totalItems })}
              </p>
            )}
          </div>
        </section>

        {/* Product grid */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-10 pb-16 md:pb-24">
          {products.length === 0 ? (
            <div className="text-center py-16 bg-[#ffffff] border border-[#c4e2f5] rounded-2xl shadow-blue-sm">
              <p className="text-[#434653] font-body-lg font-medium">{t("noProducts")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => {
                  const name = pick(product, "name", locale);
                  const description = pick(product, "description", locale);
                  const range = priceRange(product.variants);
                  const basePrice = product.basePrice ? Number(product.basePrice) : null;
                  const pricingUnitName = product.pricingUnit
                    ? pick(product.pricingUnit, "name", locale)
                    : null;

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group relative flex flex-col bg-white rounded-2xl border border-[#c4e2f5] shadow-blue-sm hover:shadow-blue-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                      <span className="absolute top-0 left-0 h-1 w-0 bg-linear-to-r from-[#078ee4] to-primary group-hover:w-full transition-all duration-500 z-10" />

                      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#e2e2eb]">
                        {product.coverImage ? (
                          <Image
                            src={product.coverImage}
                            alt={name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-10 w-10 text-[#747684]" />
                          </div>
                        )}
                        {/* Unify photography with the brand palette */}
                        <span className="absolute inset-0 bg-primary/5 pointer-events-none" />
                      </div>

                      <div className="flex-1 p-6 flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {product.category && (
                            <span className="inline-block bg-[#c4e2f5] text-[#002c7d] px-2.5 py-0.5 rounded-md font-label-sm font-medium">
                              {pick(product.category, "name", locale)}
                            </span>
                          )}
                          {product.brand && (
                            <span className="font-label-sm text-[#747684]">
                              {product.brand.name}
                            </span>
                          )}
                        </div>

                        <h2 className="font-headline-sm font-bold text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                          {name}
                        </h2>

                        {description && (
                          <p className="text-[#434653] font-body-sm line-clamp-2">
                            {description}
                          </p>
                        )}

                        <div className="mt-auto pt-3 flex items-end justify-between border-t border-[#ededf7]">
                          <div>
                            {range ? (
                              <>
                                <span className="font-label-sm text-[#747684]">{t("from")}</span>
                                <p className="font-headline-sm text-secondary font-bold">
                                  {formatPrice(range.min, locale)}
                                </p>
                              </>
                            ) : basePrice !== null ? (
                              <p className="font-headline-sm text-secondary font-bold">
                                {formatPrice(basePrice, locale)}
                              </p>
                            ) : (
                              <p className="font-label-md text-[#434653] font-semibold">
                                {t("priceOnRequest")}
                              </p>
                            )}
                            {pricingUnitName && (range || basePrice !== null) && (
                              <span className="font-label-sm text-[#747684]">
                                {pricingUnitName}
                              </span>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 font-label-sm font-semibold text-primary group-hover:gap-2 transition-all">
                            {t("viewDetail")}
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <Pagination className="pt-12">
                  <PaginationContent>
                    <PaginationItem>
                      {pageNumber > 1 ? (
                        <PaginationPrevious
                          href={buildHref({ sub: activeSub?.slug, page: pageNumber - 1 })}
                          label={tNews("prevPage")}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-4 h-9 font-semibold rounded-md border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed pointer-events-none">
                          <ChevronLeft className="h-4 w-4" />
                          <span>{tNews("prevPage")}</span>
                        </span>
                      )}
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, idx) => {
                      const pNum = idx + 1;
                      return (
                        <PaginationItem key={pNum}>
                          <PaginationLink
                            href={buildHref({ sub: activeSub?.slug, page: pNum })}
                            isActive={pNum === pageNumber}
                          >
                            {pNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      {pageNumber < totalPages ? (
                        <PaginationNext
                          href={buildHref({ sub: activeSub?.slug, page: pageNumber + 1 })}
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
