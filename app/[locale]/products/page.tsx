import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/products";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  Package,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Search,
  X,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CategorySidebar, MobileCategoryChips } from "@/components/products/category-sidebar";
import { ProductCard } from "@/components/products/product-card";
import { ProductSortAndFilter } from "@/components/products/product-filters";
import { findCatalogPage } from "@/lib/product-search";
import { searchTextWhere } from "@/lib/search";
import { JsonLd } from "@/components/seo/json-ld";
import { alternatesFor, breadcrumbLd } from "@/lib/seo";
import type { Metadata } from "next";
import type { Prisma } from "../../../generated/prisma/client";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    sub?: string;
    page?: string;
    sort?: string;
    brand?: string;
  }>;
}

const PAGE_SIZE = 9;

/**
 * Canonical path for a catalog view. Category and sub-category produce genuinely
 * distinct listings and stay in the URL; free-text search, sorting and brand
 * filters only re-slice the same set, so they collapse onto the clean address.
 */
function catalogCanonical(category?: string, sub?: string, page?: number) {
  const qs = new URLSearchParams();
  if (category) qs.set("category", category);
  if (category && sub) qs.set("sub", sub);
  if (page && page > 1) qs.set("page", String(page));
  const query = qs.toString();
  return query ? `/products?${query}` : "/products";
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q, category, sub, brand, sort, page = "1" } = await searchParams;
  const t = await getTranslations("Products");
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);

  // Filters that only reorder or narrow the same catalog: keep them crawlable
  // for discovery, but out of the index so they cannot outrank the clean page.
  const isRefinement = !!(q?.trim() || brand || sort);

  const [categoryRecord, subRecord] = await Promise.all([
    category
      ? prisma.category.findUnique({ where: { slug: category } })
      : Promise.resolve(null),
    // Sub-category slugs are only unique within their parent category, so this
    // resolves against the category currently in the URL.
    category && sub
      ? prisma.subCategory.findFirst({
          where: { slug: sub, category: { slug: category } },
        })
      : Promise.resolve(null),
  ]);

  const scope = subRecord
    ? pick(subRecord, "name", locale)
    : categoryRecord
      ? pick(categoryRecord, "name", locale)
      : null;

  const title = scope ?? t("title");
  const canonicalPage = isRefinement ? 1 : pageNumber;

  return {
    title: canonicalPage > 1 ? `${title} — ${canonicalPage}` : title,
    description: t("description"),
    alternates: alternatesFor(
      locale,
      catalogCanonical(categoryRecord?.slug, subRecord?.slug, canonicalPage)
    ),
    ...(isRefinement ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const {
    q,
    category,
    sub,
    page = "1",
    sort,
    brand,
  } = await searchParams;
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const searchQuery = (q ?? "").trim();

  const t = await getTranslations("Products");
  const tNews = await getTranslations("News");
  const tNav = await getTranslations("Header");

  // Only surface categories that actually have a published product behind them
  const categories = await prisma.category.findMany({
    where: { published: true, products: { some: { published: true } } },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: { published: true } } } },
      subCategories: {
        where: { published: true, products: { some: { published: true } } },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: { where: { published: true } } } } },
      },
    },
  });

  const activeCategory = category ? categories.find((c) => c.slug === category) : undefined;
  // A sub-category filter only applies while its parent category is selected
  const activeSub =
    activeCategory && sub
      ? activeCategory.subCategories.find((s) => s.slug === sub)
      : undefined;

  // Fetch active brands dynamically to show in the filters
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
  });

  const activeBrands = typeof brand === "string" ? brand.split(",") : [];

  const where: Prisma.ProductWhereInput = {
    published: true,
    // Spreads to nothing when there is no query, so search composes with every
    // other filter instead of replacing them.
    ...(searchTextWhere(searchQuery) ?? {}),
    ...(activeCategory ? { categoryId: activeCategory.id } : {}),
    ...(activeSub ? { subCategoryId: activeSub.id } : {}),
    ...(activeBrands.length > 0
      ? {
          brand: {
            slug: { in: activeBrands },
          },
        }
      : {}),
  };

  // Counts, ordering and paging all live in findCatalogPage — with a search term
  // in play the page is assembled from two relevance buckets, which the grid
  // below does not need to know about.
  const [{ products, totalItems, totalPages, currentPage }, catalogTotal] = await Promise.all([
    findCatalogPage({
      where,
      query: searchQuery,
      sort,
      locale,
      page: pageNumber,
      pageSize: PAGE_SIZE,
    }),
    prisma.product.count({ where: { published: true } }),
  ]);

  /** Rebuilds the current URL with one value replaced — used by paging and the search chip. */
  const buildHref = (overrides: Record<string, string | null> = {}) => {
    const qs = new URLSearchParams();
    if (searchQuery) qs.set("q", searchQuery);
    if (activeCategory) qs.set("category", activeCategory.slug);
    if (activeSub) qs.set("sub", activeSub.slug);
    if (sort) qs.set("sort", sort);
    if (brand) qs.set("brand", brand);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null) qs.delete(key);
      else qs.set(key, value);
    }
    const query = qs.toString();
    return query ? `/products?${query}` : "/products";
  };

  const pageHref = (p: number) => buildHref({ page: p > 1 ? String(p) : null });

  // The H1 follows whatever the visitor is actually looking at, so a filtered
  // catalog URL describes itself instead of repeating the generic page title.
  const isFiltered = !!(searchQuery || activeCategory);
  const heading = searchQuery
    ? t("searchResultsFor", { query: searchQuery })
    : activeSub
      ? pick(activeSub, "name", locale)
      : activeCategory
        ? pick(activeCategory, "name", locale)
        : t("title");

  const breadcrumb = breadcrumbLd(
    locale,
    [
      { name: t("title"), ...(activeCategory ? { path: "/products" } : {}) },
      ...(activeCategory
        ? [
            {
              name: pick(activeCategory, "name", locale),
              ...(activeSub
                ? { path: catalogCanonical(activeCategory.slug) }
                : {}),
            },
          ]
        : []),
      ...(activeSub ? [{ name: pick(activeSub, "name", locale) }] : []),
    ],
    tNav("nav.home")
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <JsonLd data={breadcrumb} />
      <Header />

      <main className="flex-1 main-content-spacer">
        {/* Mobile sticky chip bar — full-bleed section above the catalog,
            sticks below the fixed header so users can change filters while
            scrolling through products. Desktop sidebar is rendered inside
            the catalog grid below. */}
        <MobileCategoryChips
          categories={categories.map((c) => ({
            slug: c.slug,
            name: pick(c, "name", locale),
            count: c._count.products,
            subCategories: c.subCategories.map((s) => ({
              slug: s.slug,
              name: pick(s, "name", locale),
              count: s._count.products,
            })),
          }))}
          activeCategory={activeCategory?.slug ?? null}
          activeSub={activeSub?.slug ?? null}
          query={searchQuery || undefined}
          totalCount={catalogTotal}
          labels={{
            heading: t("categoriesHeading"),
            all: t("all"),
            allSubCategories: t("allSubCategories"),
          }}
        />

        {/* Catalog: sidebar + grid */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-6 md:py-12">
          {/* Page heading sits above the sidebar so the H1 comes first in the
              document outline, ahead of the sidebar's H2 and the card H3s. */}
          <header className="mb-6 md:mb-8">
            <h1 className="font-headline-lg-mobile md:font-headline-lg font-bold text-on-surface">
              {heading}
            </h1>
            {!isFiltered && (
              <p className="mt-2 max-w-3xl font-body-sm text-[#747684] leading-relaxed">
                {t("description")}
              </p>
            )}
          </header>

          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] gap-6 md:gap-10 items-start">
            <CategorySidebar
              categories={categories.map((c) => ({
                slug: c.slug,
                name: pick(c, "name", locale),
                count: c._count.products,
                subCategories: c.subCategories.map((s) => ({
                  slug: s.slug,
                  name: pick(s, "name", locale),
                  count: s._count.products,
                })),
              }))}
              activeCategory={activeCategory?.slug ?? null}
              activeSub={activeSub?.slug ?? null}
              query={searchQuery || undefined}
              totalCount={catalogTotal}
              labels={{
                heading: t("categoriesHeading"),
                all: t("all"),
                allSubCategories: t("allSubCategories"),
              }}
            />

            <section>
              {/* Result bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-8 border-b border-[#ededf7]">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                  <p className="font-label-md text-[#434653]">
                    {t("resultCount", { count: totalItems })}
                  </p>
                  {searchQuery && (
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#c4e2f5] bg-[#f3f3fc] py-1 pl-2.5 pr-1 font-label-sm text-[#434653]">
                      <Search className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                      <span className="truncate font-semibold">{searchQuery}</span>
                      <Link
                        href={buildHref({ q: null, page: null })}
                        aria-label={t("clearSearch")}
                        title={t("clearSearch")}
                        className="ml-0.5 rounded-full p-1 text-[#747684] transition-colors hover:bg-white hover:text-error"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </span>
                  )}
                </div>
                <ProductSortAndFilter
                  brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
                  currentParams={{ sort, brand }}
                  locale={locale}
                  hasQuery={!!searchQuery}
                  labels={{
                    sortBy: t("sortBy"),
                    filterButton: t("filterButton"),
                    sortRelevance: t("sortRelevance"),
                    sortFeatured: t("sortFeatured"),
                    sortNameAsc: t("sortNameAsc"),
                    sortNameDesc: t("sortNameDesc"),
                    apply: t("apply"),
                    clearFilters: t("clearFilters"),
                    brandHeading: t("brandHeading"),
                  }}
                />
              </div>

              {products.length === 0 ? (
                <div className="relative overflow-hidden rounded-2xl border border-[#c4e2f5] bg-white px-6 py-20 text-center shadow-blue-sm">
                  {/* Subtle backlight to lift the empty state */}
                  <div
                    aria-hidden="true"
                    className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full bg-[radial-gradient(circle,_rgba(7,142,228,0.12),_transparent_70%)] blur-2xl pointer-events-none"
                  />
                  <div className="relative">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f3f3fc] border border-[#c4e2f5]">
                      {searchQuery ? (
                        <Search className="h-8 w-8 text-[#747684]" aria-hidden="true" />
                      ) : (
                        <Package className="h-8 w-8 text-[#747684]" aria-hidden="true" />
                      )}
                    </div>
                    <p className="mt-5 font-headline-sm font-semibold text-on-surface">
                      {searchQuery
                        ? t("noResultsFor", { query: searchQuery })
                        : t("noProducts")}
                    </p>
                    {searchQuery && (
                      <p className="mt-2 font-body-sm text-[#747684]">{t("noResultsHint")}</p>
                    )}
                    <Link
                      href={searchQuery ? buildHref({ q: null, page: null }) : "/products"}
                      className="mt-6 inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 font-label-md font-semibold text-white bg-linear-to-b from-[#078ee4] to-primary-container shadow-blue-sm transition-all hover:brightness-110"
                    >
                      {searchQuery ? t("clearSearch") : t("all")}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        locale={locale}
                        viewDetailLabel={t("viewDetail")}
                        skuLabel={t("sku")}
                        optionsLabel={t("options")}
                        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 50vw, 33vw"
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="pt-10 flex flex-col items-center gap-3">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            {currentPage > 1 ? (
                              <PaginationPrevious
                                href={pageHref(currentPage - 1)}
                                label={tNews("prevPage")}
                              />
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-4 h-9 font-semibold rounded-md border border-[#e2e2eb] bg-[#f3f3fc] text-[#747684] cursor-not-allowed pointer-events-none">
                                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                <span>{tNews("prevPage")}</span>
                              </span>
                            )}
                          </PaginationItem>

                          {Array.from({ length: totalPages }, (_, idx) => {
                            const pNum = idx + 1;
                            return (
                              <PaginationItem key={pNum}>
                                <PaginationLink
                                  href={pageHref(pNum)}
                                  isActive={pNum === currentPage}
                                >
                                  {pNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}

                          <PaginationItem>
                            {currentPage < totalPages ? (
                              <PaginationNext
                                href={pageHref(currentPage + 1)}
                                label={tNews("nextPage")}
                              />
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-4 h-9 font-semibold rounded-md border border-[#e2e2eb] bg-[#f3f3fc] text-[#747684] cursor-not-allowed pointer-events-none">
                                <span>{tNews("nextPage")}</span>
                                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                              </span>
                            )}
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      <p className="font-label-sm text-[#747684] tabular-nums">
                        {currentPage} {t("pageOf")} {totalPages}
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}
