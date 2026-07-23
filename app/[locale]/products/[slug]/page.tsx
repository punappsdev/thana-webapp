import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactFab } from "@/components/ui/contact-fab";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/products";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Lightbulb, MessageSquareQuote } from "lucide-react";
import { ProductGallery } from "@/components/products/product-gallery";
import {
  VariantSelector,
  type AttributeGroup,
  type VariantOption,
} from "@/components/products/variant-selector";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product || !product.published) return {};
  return {
    title: pick(product, "name", locale),
    description: pick(product, "description", locale) || undefined,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations("Products");

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      subCategory: true,
      brand: true,
      unit: true,
      pricingUnit: true,
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

  // Prisma Decimal cannot cross into a client component — convert to numbers first
  const variants: VariantOption[] = product.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    price: Number(v.price),
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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
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
                    <span className="inline-block bg-[#c4e2f5] text-[#002c7d] px-2.5 py-0.5 rounded-md font-label-sm font-medium">
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
                locale={locale}
                basePrice={product.basePrice !== null ? Number(product.basePrice) : null}
                baseSku={product.sku}
                pricingUnitName={product.pricingUnit ? pick(product.pricingUnit, "name", locale) : null}
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
                  pricingUnitNameTh: product.pricingUnit?.nameTh ?? null,
                  pricingUnitNameEn: product.pricingUnit?.nameEn ?? null,
                }}
              />

              <p className="font-label-sm text-[#747684]">{t("priceNote")}</p>

              <div className="flex flex-wrap gap-3">
                {/* Secondary now that adding to the cart is the primary action */}
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-label-md font-semibold text-primary border border-primary hover:bg-[#f3f3fc] transition-all"
                >
                  <MessageSquareQuote className="h-4 w-4" />
                  {t("requestQuote")}
                </Link>

                {product.catalogPdf && (
                  <a
                    href={product.catalogPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-label-md font-semibold text-primary border border-primary hover:bg-[#f3f3fc] transition-all"
                  >
                    <FileText className="h-4 w-4" />
                    {t("downloadCatalog")}
                  </a>
                )}
              </div>
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
                  {product.pricingUnit && (
                    <div className="py-3 last:pb-0">
                      <dt className="font-label-sm text-[#747684] mb-1">{t("pricingUnit")}</dt>
                      <dd className="font-body-sm text-on-surface">
                        {pick(product.pricingUnit, "name", locale)}
                      </dd>
                    </div>
                  )}
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
