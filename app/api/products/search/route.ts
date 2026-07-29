import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPrice, pick, priceRange, toNumber } from "@/lib/products";
import {
  MAX_QUERY_LENGTH,
  compareByRelevance,
  scoreProduct,
  searchTextWhere,
  tokenizeQuery,
} from "@/lib/search";

/**
 * Typeahead endpoint behind the header search box.
 *
 * Optimised for latency over completeness: a narrow `select` (never the catalog
 * page's nested variant include), a small candidate pool ranked in memory, and
 * everything a client component cannot handle — Prisma `Decimal`s, Th/En column
 * pairs — resolved here before serialising.
 */

/** How many matches we pull before ranking. Wide enough that the best result is in it. */
const CANDIDATE_POOL = 24;

/** How many of each kind survive into the dropdown. */
const PRODUCT_LIMIT = 6;
const CATEGORY_LIMIT = 4;
const BRAND_LIMIT = 3;

export interface SearchSuggestion {
  id: number;
  slug: string;
  name: string;
  sku: string;
  coverImage: string | null;
  price: string | null;
  categoryName: string | null;
}

export interface SearchGroupItem {
  slug: string;
  name: string;
  /** Parent category slug — set only for sub-categories, which need both params. */
  parentSlug?: string;
}

export interface SearchResponse {
  products: SearchSuggestion[];
  categories: SearchGroupItem[];
  brands: SearchGroupItem[];
  total: number;
}

const EMPTY: SearchResponse = { products: [], categories: [], brands: [], total: 0 };

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = (params.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const locale = params.get("locale") === "en" ? "en" : "th";

  // A query of only punctuation tokenises to nothing; answer it without a round trip.
  const where = searchTextWhere(query);
  if (!where || tokenizeQuery(query).length === 0) {
    return NextResponse.json(EMPTY);
  }

  const productWhere = { published: true, ...where };
  const nameField = locale === "en" ? "nameEn" : "nameTh";

  try {
    const [candidates, total, categories, subCategories, brands] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
        select: {
          id: true,
          slug: true,
          nameTh: true,
          nameEn: true,
          sku: true,
          coverImage: true,
          basePrice: true,
          featured: true,
          sortOrder: true,
          category: { select: { nameTh: true, nameEn: true } },
          variants: { select: { price: true } },
        },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        take: CANDIDATE_POOL,
      }),
      prisma.product.count({ where: productWhere }),
      prisma.category.findMany({
        where: {
          published: true,
          products: { some: { published: true } },
          [nameField]: { contains: query },
        },
        select: { slug: true, nameTh: true, nameEn: true },
        orderBy: { sortOrder: "asc" },
        take: CATEGORY_LIMIT,
      }),
      prisma.subCategory.findMany({
        where: {
          published: true,
          products: { some: { published: true } },
          [nameField]: { contains: query },
        },
        select: { slug: true, nameTh: true, nameEn: true, category: { select: { slug: true } } },
        orderBy: { sortOrder: "asc" },
        take: CATEGORY_LIMIT,
      }),
      prisma.brand.findMany({
        where: { name: { contains: query }, products: { some: { published: true } } },
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
        take: BRAND_LIMIT,
      }),
    ]);

    const products: SearchSuggestion[] = candidates
      .map((product) => ({ ...product, score: scoreProduct(product, query) }))
      .sort(compareByRelevance)
      .slice(0, PRODUCT_LIMIT)
      .map((product) => {
        const range = priceRange(product.variants);
        const price = range ? range.min : toNumber(product.basePrice);
        return {
          id: product.id,
          slug: product.slug,
          name: pick(product, "name", locale),
          sku: product.sku,
          coverImage: product.coverImage,
          price: formatPrice(price, locale),
          categoryName: product.category ? pick(product.category, "name", locale) : null,
        };
      });

    return NextResponse.json(
      {
        products,
        categories: [
          ...categories.map((category) => ({
            slug: category.slug,
            name: pick(category, "name", locale),
          })),
          ...subCategories.map((sub) => ({
            slug: sub.slug,
            name: pick(sub, "name", locale),
            parentSlug: sub.category.slug,
          })),
        ].slice(0, CATEGORY_LIMIT),
        brands: brands.map((brand) => ({ slug: brand.slug, name: brand.name })),
        total,
      } satisfies SearchResponse,
      {
        headers: {
          // Suggestions may lag a published product by a minute; that is a fair
          // trade for keeping repeated keystrokes off the database.
          "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Product search failed:", error);
    return NextResponse.json(EMPTY, { status: 500 });
  }
}
