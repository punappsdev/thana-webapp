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
import type { Prisma } from "../../../generated/prisma/client";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    sub?: string;
    page?: string;
    sort?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

const PAGE_SIZE = 9;

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const {
    category,
    sub,
    page = "1",
    sort,
    brand,
    minPrice,
    maxPrice,
  } = await searchParams;
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);

  const t = await getTranslations("Products");
  const tNews = await getTranslations("News");

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
  const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
  const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;

  const where: Prisma.ProductWhereInput = {
    published: true,
    ...(activeCategory ? { categoryId: activeCategory.id } : {}),
    ...(activeSub ? { subCategoryId: activeSub.id } : {}),
    ...(activeBrands.length > 0
      ? {
          brand: {
            slug: { in: activeBrands },
          },
        }
      : {}),
    ...(minPriceNum !== undefined || maxPriceNum !== undefined
      ? {
          basePrice: {
            ...(minPriceNum !== undefined ? { gte: minPriceNum } : {}),
            ...(maxPriceNum !== undefined ? { lte: maxPriceNum } : {}),
          },
        }
      : {}),
  };

  const [totalItems, catalogTotal] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.count({ where: { published: true } }),
  ]);

  // Clamp before querying, so an out-of-range ?page= lands on the last real page
  // instead of an empty grid that contradicts the result count beside it
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(pageNumber, totalPages);

  let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
  if (sort === "price-asc") {
    orderBy = [{ basePrice: "asc" }, { sortOrder: "asc" }];
  } else if (sort === "price-desc") {
    orderBy = [{ basePrice: "desc" }, { sortOrder: "asc" }];
  } else if (sort === "name-asc") {
    orderBy = [{ [locale === "th" ? "nameTh" : "nameEn"]: "asc" }];
  } else if (sort === "name-desc") {
    orderBy = [{ [locale === "th" ? "nameTh" : "nameEn"]: "desc" }];
  } else {
    orderBy = [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }];
  }

  // Count and page at the database level rather than slicing in memory
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      subCategory: true,
      brand: true,
      pricingUnit: true,
      variants: {
        include: {
          attributeValues: {
            include: {
              attributeValue: {
                include: {
                  attribute: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy,
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    if (activeCategory) qs.set("category", activeCategory.slug);
    if (activeSub) qs.set("sub", activeSub.slug);
    if (sort) qs.set("sort", sort);
    if (brand) qs.set("brand", brand);
    if (minPrice) qs.set("minPrice", minPrice);
    if (maxPrice) qs.set("maxPrice", maxPrice);
    if (p > 1) qs.set("page", String(p));
    const q = qs.toString();
    return q ? `/products?${q}` : "/products";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
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
          totalCount={catalogTotal}
          labels={{
            heading: t("categoriesHeading"),
            all: t("all"),
            allSubCategories: t("allSubCategories"),
          }}
        />

        {/* Catalog: sidebar + grid */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-6 md:py-12">
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
              totalCount={catalogTotal}
              labels={{
                heading: t("categoriesHeading"),
                all: t("all"),
                allSubCategories: t("allSubCategories"),
              }}
            />

            <section>
              {/* Result bar */}
              <div className="flex items-center justify-between gap-3 pb-5 mb-8 border-b border-[#ededf7]">
                <p className="font-label-md text-[#434653]">
                  {t("resultCount", { count: totalItems })}
                </p>
                <ProductSortAndFilter
                  brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
                  currentParams={{ sort, brand, minPrice, maxPrice }}
                  locale={locale}
                  labels={{
                    sortBy: t("sortBy"),
                    filterButton: t("filterButton"),
                    sortFeatured: t("sortFeatured"),
                    sortPriceAsc: t("sortPriceAsc"),
                    sortPriceDesc: t("sortPriceDesc"),
                    sortNameAsc: t("sortNameAsc"),
                    sortNameDesc: t("sortNameDesc"),
                    priceRange: t("priceRange"),
                    minPrice: t("minPrice"),
                    maxPrice: t("maxPrice"),
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
                      <Package className="h-8 w-8 text-[#747684]" aria-hidden="true" />
                    </div>
                    <p className="mt-5 font-headline-sm font-semibold text-on-surface">
                      {t("noProducts")}
                    </p>
                    <Link
                      href="/products"
                      className="mt-6 inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 font-label-md font-semibold text-white bg-linear-to-b from-[#078ee4] to-primary-container shadow-blue-sm transition-all hover:brightness-110"
                    >
                      {t("all")}
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
                        priceOnRequestLabel={t("priceOnRequest")}
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
