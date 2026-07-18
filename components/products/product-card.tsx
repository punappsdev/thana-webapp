import { ArrowRight, Package } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { formatPrice, pick, priceRange } from "@/lib/products";
import type { Prisma } from "../../generated/prisma/client";

/**
 * Shape required by `ProductCard`. Both the homepage list and the catalog
 * page query products with this include shape (the catalog page adds more
 * relations, which structurally satisfy this narrower type).
 */
export type ProductCardProduct = Prisma.ProductGetPayload<{
  include: {
    pricingUnit: true;
    variants: { select: { price: true } };
  };
}>;

interface ProductCardProps {
  product: ProductCardProduct;
  locale: string;
  priceOnRequestLabel: string;
  /** Next/Image `sizes` hint — defaults to the 3-column catalog layout. */
  sizes?: string;
}

/**
 * Shared product card used on the homepage and the product catalog.
 * Style: full-bleed square image with a 5% blue overlay, primary-coloured
 * title, optional description, price block, and a circular arrow CTA that
 * fills on hover. Featured badges are intentionally omitted for now.
 */
export function ProductCard({
  product,
  locale,
  priceOnRequestLabel,
  sizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw",
}: ProductCardProps) {
  const name = pick(product, "name", locale);
  const description = pick(product, "description", locale);
  const range = priceRange(product.variants);
  const basePrice = product.basePrice ? Number(product.basePrice) : null;
  const price = range ? range.min : basePrice;

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

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-headline-sm text-primary mb-2 font-semibold line-clamp-2">
          {name}
        </h3>
        {description && (
          <p className="font-body-sm text-muted-foreground line-clamp-2 mb-4">
            {description}
          </p>
        )}

        <div className="mt-auto flex justify-between items-center">
          <div>
            {price !== null ? (
              <>
                <span className="font-body-lg text-secondary font-bold">
                  {formatPrice(price, locale)}
                </span>
                {product.pricingUnit && (
                  <span className="block font-label-sm text-muted-foreground">
                    {pick(product.pricingUnit, "name", locale)}
                  </span>
                )}
              </>
            ) : (
              <span className="font-label-md text-[#434653] font-semibold">
                {priceOnRequestLabel}
              </span>
            )}
          </div>
          {/* Circular CTA accent — echoes the logo's outer ring */}
          <span
            className="p-2 rounded-full border border-primary-container text-primary group-hover:bg-primary-container group-hover:text-white transition-all"
            aria-hidden="true"
          >
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
