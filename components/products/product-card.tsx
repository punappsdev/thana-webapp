import { ArrowRight, Package } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { pick } from "@/lib/products";
import type { Prisma } from "../../generated/prisma/client";

/**
 * Shape required by `ProductCard`. Both the homepage list and the catalog
 * page query products with this include shape (the catalog page adds more
 * relations, which structurally satisfy this narrower type).
 */
export type ProductCardProduct = Prisma.ProductGetPayload<{
  include: {
    variants: {
      include: {
        attributeValues: {
          include: {
            attributeValue: {
              include: {
                attribute: true;
              };
            };
          };
        };
      };
    };
  };
}>;

interface ProductCardProps {
  product: ProductCardProduct;
  locale: string;
  viewDetailLabel: string;
  skuLabel?: string;
  optionsLabel?: string;
  /** Next/Image `sizes` hint — defaults to the 3-column catalog layout. */
  sizes?: string;
}

/**
 * Shared product card used on the homepage and the product catalog.
 * Style: full-bleed square image with a 5% blue overlay, primary-coloured
 * title, optional description, and a circular arrow CTA that fills on hover.
 * Featured badges are intentionally omitted for now.
 */
export function ProductCard({
  product,
  locale,
  viewDetailLabel,
  skuLabel,
  optionsLabel,
  sizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw",
}: ProductCardProps) {
  const name = pick(product, "name", locale);

  // Resolve labels fallback
  const resolvedSkuLabel = skuLabel || (locale === "en" ? "SKU" : "รหัสสินค้า");
  const resolvedOptionsLabel = optionsLabel || (locale === "en" ? "Options" : "ตัวเลือก");

  // Group variant values by attribute to display a clean summary of options
  const groupMap = new Map<number, { name: string; values: Set<string> }>();
  if (product.variants) {
    for (const v of product.variants) {
      if (!v.attributeValues) continue;
      for (const av of v.attributeValues) {
        const val = av.attributeValue;
        if (!val) continue;
        const attr = val.attribute;
        if (!attr) continue;

        const attrId = attr.id;
        const attrName = pick(attr, "name", locale);
        const valLabel = pick(val, "value", locale);

        if (!groupMap.has(attrId)) {
          groupMap.set(attrId, {
            name: attrName,
            values: new Set<string>(),
          });
        }
        groupMap.get(attrId)!.values.add(valLabel);
      }
    }
  }
  const optionGroups = Array.from(groupMap.values());

  return (
    <Link
      href={`/products/${product.slug}`}
      className="bg-white rounded-xl overflow-hidden group transition-all duration-300 border border-border/50 flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078ee4] focus-visible:ring-offset-2"
      style={{ boxShadow: "0 10px 30px -10px rgba(0, 64, 173, 0.08)" }}
    >
      <div className="relative overflow-hidden aspect-square bg-[#e2e2eb]">
        {product.coverImage ? (
          <Image
            src={product.coverImage}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes={sizes}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-[#747684]" aria-hidden="true" />
          </div>
        )}
        {/* 5% blue overlay unifies photography with the brand palette */}
        <span className="absolute inset-0 bg-primary/5 pointer-events-none" aria-hidden="true" />
      </div>

      <div className="p-3 md:p-6 flex flex-col flex-1">
        <h3 className="font-label-md md:font-headline-sm text-primary mb-1 font-semibold line-clamp-2">
          {name}
        </h3>

        {product.sku && (
          <div className="font-label-sm text-[#747684] mb-2 flex flex-wrap items-baseline gap-x-1">
            <span className="inline md:hidden">
              {locale === "th" ? "รหัส:" : "SKU:"}
            </span>
            <span className="hidden md:inline">{resolvedSkuLabel}:</span>
            <span className="font-semibold break-all">{product.sku}</span>
          </div>
        )}



        {optionGroups.length > 0 && (
          <div className="flex flex-col gap-1 mb-3 pt-2 border-t border-[#ededf7]">
            <div className="font-label-sm text-[#747684] font-semibold">
              <span>{resolvedOptionsLabel}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {optionGroups.map((group) => (
                <div key={group.name} className="font-label-sm flex flex-wrap gap-x-1.5 items-baseline">
                  <span className="font-medium text-primary">{group.name}:</span>
                  <span className="text-[#434653]">
                    {Array.from(group.values).join(", ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto flex justify-between items-center gap-2 pt-3 border-t border-[#ededf7]/50">
          <span className="font-label-md text-primary font-semibold truncate">
            {viewDetailLabel}
          </span>
          {/* Circular CTA accent — echoes the logo's outer ring */}
          <span
            className="shrink-0 p-2 rounded-full border border-primary-container text-primary group-hover:bg-primary-container group-hover:text-white transition-all"
            aria-hidden="true"
          >
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
