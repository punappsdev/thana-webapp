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
import { ProductPromotions } from "@/components/products/product-promotions";
import { getPromotionsForProduct } from "@/lib/promotions";
import { MAX_TEXT_FIELD_LENGTH } from "@/lib/quotation-custom-fields";
import {
  VariantSelector,
  type AttributeGroup,
  type CustomFieldOption,
  type VariantOption,
} from "@/components/products/variant-selector";
import { JsonLd } from "@/components/seo/json-ld";
import {
  SITE_URL,
  absoluteUrl,
  alternatesFor,
  breadcrumbLd,
  metaDescription,
} from "@/lib/seo";
import type { Metadata } from "next";
import { sanitizeRichHtml } from "@/lib/admin/security";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product || !product.published) return {};
  const t = await getTranslations("Products");
  const name = pick(product, "name", locale);
  // The catalogue description is free-form multi-line text with no length cap,
  // so it is flattened and clamped; products written without one fall back to a
  // generated line instead of inheriting the site-wide default.
  const description = metaDescription(
    locale,
    richTextToPlainText(pick(product, "description", locale)),
    t("detailMetaDescription", { name })
  );
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
      customFields: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product || !product.published) notFound();

  const promotions = await getPromotionsForProduct(product);

  const name = pick(product, "name", locale);
  const description = pick(product, "description", locale);
  const usageGuide = pick(product, "usageGuide", locale);
  // Sanitize again at the rendering boundary for legacy rows written before
  // rich text persistence was added, and to keep every innerHTML path safe.
  const descriptionHtml = sanitizeRichHtml(description || "");
  const usageGuideHtml = sanitizeRichHtml(usageGuide || "");
  const descriptionText = richTextToPlainText(description);
  const brandName = product.brand ? pick(product.brand, "name", locale) : null;
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
   * Bounds are converted to plain numbers here: a Prisma Decimal cannot cross
   * into the client component (same reason as `toNumber` in lib/products.ts).
   */
  const customFields: CustomFieldOption[] = product.customFields.map((field) => {
    const isText = field.inputType === "TEXT";
    const min = field.minValue === null ? null : Number(field.minValue);
    const max = field.maxValue === null ? null : Number(field.maxValue);
    const step = field.step === null ? null : Number(field.step);
    const unit = pick(field, "unit", locale) || null;

    // A text field's only limit is its length, so that doubles as both the
    // standing hint and the message shown when the customer overruns it.
    const rangeLabel = isText
      ? t("customFieldMaxLength", { max: field.maxLength ?? MAX_TEXT_FIELD_LENGTH })
      : t("customFieldRange", {
          min: trimZeros(min ?? 0),
          max: trimZeros(max ?? 0),
          unit: unit ?? "",
        });

    return {
      id: field.id,
      inputType: field.inputType,
      triggerValueId: field.triggerValueId,
      label: pick(field, "label", locale),
      unit,
      labelTh: field.labelTh,
      labelEn: field.labelEn,
      unitTh: field.unitTh,
      unitEn: field.unitEn,
      min,
      max,
      step,
      maxLength: field.maxLength,
      required: field.required,
      hintLabel: rangeLabel,
      rangeLabel,
      stepLabel: t("customFieldStep", { step: trimZeros(step ?? 1), unit: unit ?? "" }),
    };
  });

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
    description: descriptionText || undefined,
    sku: product.sku,
    url: absoluteUrl(locale, `/products/${slug}`),
    image: gallery.map((img) => `${SITE_URL}${img.url}`),
    ...(brandName ? { brand: { "@type": "Brand", name: brandName } } : {}),
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
                  {brandName && (
                    <span className="font-label-sm text-[#747684]">{brandName}</span>
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
                customFields={customFields}
                labels={{
                  selectOptions: t("selectOptions"),
                  selectAllPrompt: t("selectAllPrompt"),
                  unavailable: t("unavailableCombination"),
                  sku: t("sku"),
                  customFieldsPrompt: t("customFieldsPrompt"),
                  customFieldsIncomplete: t("customFieldsIncomplete"),
                  customFieldOptional: t("customFieldOptional"),
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

          {/* Promotions bound to this product from the admin panel */}
          <ProductPromotions promotions={promotions} locale={locale} />

          {/* Details below the fold */}
          <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {descriptionHtml.trim() && (
                <section aria-labelledby="product-description-heading" className="rounded-2xl border border-[#c4e2f5] bg-white p-6 shadow-blue-sm">
                  <h2 id="product-description-heading" className="font-headline-sm font-semibold text-primary mb-3">
                    {t("descriptionHeading")}
                  </h2>
                  <div
                    className="font-body-md text-[#434653] leading-relaxed whitespace-pre-line
                      [&_p]:mb-4 [&_h2]:font-headline-md [&_h2]:font-semibold [&_h2]:text-primary [&_h2]:mt-6 [&_h2]:mb-3
                      [&_h3]:font-headline-sm [&_h3]:font-semibold [&_h3]:text-primary [&_h3]:mt-5 [&_h3]:mb-2
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4
                      [&_hr]:my-6 [&_hr]:border-t [&_hr]:border-border [&_a]:text-secondary [&_a]:underline [&_a]:underline-offset-2
                      [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic [&_u]:underline [&_s]:line-through
                      [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  />
                </section>
              )}

              {usageGuideHtml.trim() && (
                <section aria-labelledby="product-usage-heading" className="rounded-2xl border border-[#c4e2f5] bg-white p-6 shadow-blue-sm">
                  <h2 id="product-usage-heading" className="inline-flex items-center gap-2 font-headline-sm font-semibold text-primary mb-3">
                    <Lightbulb className="h-5 w-5" />
                    {t("usageGuide")}
                  </h2>
                  <div
                    className="font-body-md text-[#434653] leading-relaxed whitespace-pre-line
                      [&_p]:mb-4 [&_h2]:font-headline-md [&_h2]:font-semibold [&_h2]:text-primary [&_h2]:mt-6 [&_h2]:mb-3
                      [&_h3]:font-headline-sm [&_h3]:font-semibold [&_h3]:text-primary [&_h3]:mt-5 [&_h3]:mb-2
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4
                      [&_hr]:my-6 [&_hr]:border-t [&_hr]:border-border [&_a]:text-secondary [&_a]:underline [&_a]:underline-offset-2
                      [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic [&_u]:underline [&_s]:line-through
                      [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: usageGuideHtml }}
                  />
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

/**
 * Bounds come out of Decimal(12,3) columns, so 1200 arrives as 1200.000. Trimmed
 * here rather than with Intl so the number reads identically in both locales —
 * the sales team and the factory compare it against the same figure.
 */
function trimZeros(value: number): string {
  return String(Number(value.toFixed(3)));
}

/** Convert sanitized editor HTML to plain text for metadata and JSON-LD. */
function richTextToPlainText(value: string | null): string {
  return decodeHtmlEntities(
    (value ? sanitizeRichHtml(value) : "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|h2|h3|li|blockquote)>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtmlEntities(value: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };
  return value.replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/gi, (entity) => entities[entity.toLowerCase()] ?? entity);
}
