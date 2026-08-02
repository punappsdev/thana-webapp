import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/products";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Lightbulb } from "lucide-react";
import { ProductGallery } from "@/components/products/product-gallery";
import {
  VariantSelector,
  type AttributeGroup,
  type VariantOption,
} from "@/components/products/variant-selector";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, absoluteUrl, alternatesFor, breadcrumbLd } from "@/lib/seo";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product || !product.published) return {};
  const name = pick(product, "name", locale);
  const description = pick(product, "description", locale) || undefined;
  return {
    title: name,
    description,
    alternates: alternatesFor(locale, `/products/${slug}`),
    openGraph: {
      title: name,
      description,
      url: absoluteUrl(locale, `/products/${slug}`),
      images: product.coverImage ? [`${SITE_URL}${product.coverImage}`] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations("Products");
  const tNav = await getTranslations("Header");

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      subCategory: true,
      brand: true,
      unit: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        orderBy: { sortOrder: "asc" },
        include: {
          attributeValues: {
            include: { attributeValue: { include: { attribute: true } } },
          },
        },
      },
      attributes: { orderBy: { sortOrder: "asc" } },
      attributeLinks: {
        include: { attributeValue: { include: { attribute: true } } },
      },
    },
  });

  if (!product || !product.published) notFound();

  const name = pick(product, "name", locale);
  const description = pick(product, "description", locale);
  const usageGuide = pick(product, "usageGuide", locale);
  const catalogDownloadUrl = product.catalogPdf
    ? `${product.catalogPdf}${product.catalogPdf.includes("?") ? "&" : "?"}download=1`
    : null;

  const variants: VariantOption[] = product.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    isAvailable: v.isAvailable,
    isDefault: v.isDefault,
    valueIds: v.attributeValues.map((av) => av.attributeValueId),
  }));

  /**
   * Only build selector groups for attributes the variants actually differ on.
   * A product's attributeLinks also carry filter-only values (e.g. "custom cut")
   * that no variant uses, and those must not become unselectable dead options.
   */
  const groupMap = new Map<number, AttributeGroup>();
  for (const v of product.variants) {
    for (const { attributeValue } of v.attributeValues) {
      const attr = attributeValue.attribute;
      if (!groupMap.has(attr.id)) {
        groupMap.set(attr.id, {
          id: attr.id,
          name: pick(attr, "name", locale),
          nameTh: attr.nameTh,
          nameEn: attr.nameEn,
          unit: attr.unit,
          inputType: attr.inputType,
          values: [],
        });
      }
      const group = groupMap.get(attr.id)!;
      if (!group.values.some((val) => val.id === attributeValue.id)) {
        group.values.push({
          id: attributeValue.id,
          label: pick(attributeValue, "value", locale),
          valueTh: attributeValue.valueTh,
          valueEn: attributeValue.valueEn,
          colorHex: attributeValue.colorHex,
        });
      }
    }
  }
  const groups = Array.from(groupMap.values());

  /**
   * Spec table: every attribute value on the product, variant-driven or not.
   * Keyed by attribute id — keying by the localized label would merge two
   * distinct attributes that happen to share a Thai name into one row.
   */
  const specOrder = new Map(product.attributes.map((link) => [link.attributeId, link.sortOrder]));
  const specMap = new Map<number, { label: string; values: string[] }>();
  for (const link of product.attributeLinks) {
    const attr = link.attributeValue.attribute;
    const label = pick(attr, "name", locale) + (attr.unit ? ` (${attr.unit})` : "");
    const entry = specMap.get(attr.id) ?? { label, values: [] };
    entry.values.push(pick(link.attributeValue, "value", locale));
    specMap.set(attr.id, entry);
  }
  const specs = Array.from(specMap.entries()).sort(
    ([a], [b]) => (specOrder.get(a) ?? Number.MAX_SAFE_INTEGER) - (specOrder.get(b) ?? Number.MAX_SAFE_INTEGER),
  );

  const gallery = [
    ...(product.coverImage ? [{ url: product.coverImage, alt: name }] : []),
    ...product.images.map((img) => ({
      url: img.url,
      alt: pick(img, "alt", locale) || name,
    })),
  ];

  // No `offers` node: this catalog is quotation-based and has no published
  // prices, and an offer without a price is worse than no offer at all.
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || undefined,
    sku: product.sku,
    url: absoluteUrl(locale, `/products/${slug}`),
    image: gallery.map((img) => `${SITE_URL}${img.url}`),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(product.category
      ? { category: pick(product.category, "name", locale) }
      : {}),
    ...(specs.length > 0
      ? {
          additionalProperty: specs.map(([, spec]) => ({
            "@type": "PropertyValue",
            name: spec.label,
            value: spec.values.join(", "),
          })),
        }
      : {}),
  };

  const breadcrumb = breadcrumbLd(
    locale,
    [
      { name: t("title"), path: "/products" },
      ...(product.category
        ? [
            {
              name: pick(product.category, "name", locale),
              path: `/products?category=${product.category.slug}`,
            },
          ]
        : []),
      { name },
    ],
    tNav("nav.home")
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumb} />
      <Header />

      <main className="flex-1 main-content-spacer">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="mb-8 flex flex-wrap items-center gap-2 font-label-sm text-[#434653]">
            <Link href="/products" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              {t("backToProducts")}
            </Link>
            {product.category && (
              <>
                <span className="text-[#c4c6d5]">/</span>
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {pick(product.category, "name", locale)}
                </Link>
              </>
            )}
            {product.subCategory && product.category && (
              <>
                <span className="text-[#c4c6d5]">/</span>
                <Link
                  href={`/products?category=${product.category.slug}&sub=${product.subCategory.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {pick(product.subCategory, "name", locale)}
                </Link>
              </>
            )}
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            {/* Gallery */}
            <ProductGallery images={gallery} locale={locale} />

            {/* Summary + variant picker */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {product.category && (
                    <span className="inline-block bg-[#c4e2f5] text-[#002c7d] px-2.5 py-1 rounded-md font-label-sm font-medium">
                      {pick(product.category, "name", locale)}
                    </span>
                  )}
                  {product.brand && (
                    <span className="font-label-sm text-[#747684]">{product.brand.name}</span>
                  )}
                </div>

                <h1 className="font-headline-lg-mobile md:font-headline-lg font-bold text-on-surface">
                  {name}
                </h1>

                <div className="flex flex-wrap gap-x-6 gap-y-1 font-label-sm text-[#434653]">
                  <span>
                    {t("sku")}: <strong className="font-semibold">{product.sku}</strong>
                  </span>
                  {product.unit && (
                    <span>
                      {t("unit")}:{" "}
                      <strong className="font-semibold">{pick(product.unit, "name", locale)}</strong>
                    </span>
                  )}
                </div>
              </div>

              <VariantSelector
                groups={groups}
                variants={variants}
                baseSku={product.sku}
                labels={{
                  selectOptions: t("selectOptions"),
                  selectAllPrompt: t("selectAllPrompt"),
                  unavailable: t("unavailableCombination"),
                  sku: t("sku"),
                }}
                cartProduct={{
                  productId: product.id,
                  slug: product.slug,
                  // Both languages, so the cart follows the locale switcher
                  nameTh: product.nameTh,
                  nameEn: product.nameEn,
                  image: gallery[0]?.url ?? null,
                }}
              />

              {product.catalogPdf && (
                <div className="flex flex-wrap gap-3">
                  <a
                    href={catalogDownloadUrl ?? undefined}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-label-md font-semibold text-primary border border-primary hover:bg-[#f3f3fc] transition-all"
                  >
                    <FileText className="h-4 w-4" />
                    {t("downloadCatalog")}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Details below the fold */}
          <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {description && (
                <section className="rounded-2xl border border-[#c4e2f5] bg-white p-6 shadow-blue-sm">
                  <h2 className="font-headline-sm font-semibold text-primary mb-3">
                    {t("descriptionHeading")}
                  </h2>
                  <p className="font-body-md text-[#434653] leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </section>
              )}

              {usageGuide && (
                <section className="rounded-2xl border border-[#c4e2f5] bg-white p-6 shadow-blue-sm">
                  <h2 className="inline-flex items-center gap-2 font-headline-sm font-semibold text-primary mb-3">
                    <Lightbulb className="h-5 w-5" />
                    {t("usageGuide")}
                  </h2>
                  <p className="font-body-md text-[#434653] leading-relaxed whitespace-pre-line">
                    {usageGuide}
                  </p>
                </section>
              )}
            </div>

            {specs.length > 0 && (
              <aside className="rounded-2xl border border-[#c4e2f5] bg-white p-6 shadow-blue-sm h-fit">
                <h2 className="font-headline-sm font-semibold text-primary mb-4">
                  {t("specifications")}
                </h2>
                <dl className="divide-y divide-[#ededf7]">
                  {specs.map(([attributeId, spec]) => (
                    <div key={attributeId} className="py-3 first:pt-0 last:pb-0">
                      <dt className="font-label-sm text-[#747684] mb-1">{spec.label}</dt>
                      <dd className="font-body-sm text-on-surface">{spec.values.join(", ")}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}
