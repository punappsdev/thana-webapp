import Image from "next/image";
import { ArrowRight, Calendar, Tag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { pick } from "@/lib/products";
import type { ProductPromotion } from "@/lib/promotions";

interface ProductPromotionsProps {
  promotions: ProductPromotion[];
  locale: string;
}

/**
 * Full-width band on the product detail page listing the promotions bound to
 * this product from the admin panel. Renders nothing when there are none, so
 * the page keeps its original layout for the majority of products.
 */
export async function ProductPromotions({ promotions, locale }: ProductPromotionsProps) {
  if (promotions.length === 0) return null;

  const t = await getTranslations("Products");
  const tNews = await getTranslations("News");

  return (
    <section className="mt-12 rounded-2xl border border-[#c4e2f5] bg-[#f8fbfe] p-6 md:p-8 shadow-blue-sm">
      <h2 className="inline-flex items-center gap-2 font-headline-sm font-semibold text-primary mb-5">
        <Tag className="h-5 w-5" />
        {t("promotionsHeading")}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promo) => {
          const title = pick(promo, "title", locale);
          const excerpt = pick(promo, "excerpt", locale);
          const validUntil = promo.endDate
            ? new Date(promo.endDate).toLocaleDateString(locale === "en" ? "en-US" : "th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : null;

          return (
            <Link
              key={promo.id}
              href={`/promotions/${promo.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#c4e2f5] bg-white shadow-blue-sm transition-all hover:shadow-blue-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078ee4] focus-visible:ring-offset-2"
            >
              <div className="relative aspect-video overflow-hidden bg-[#e2e2eb]">
                {promo.coverImage ? (
                  <Image
                    src={promo.coverImage}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Tag className="h-8 w-8 text-[#747684]" aria-hidden="true" />
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-md bg-[#c4e2f5] px-2.5 py-1 font-label-sm font-semibold text-[#002c7d]">
                  {tNews("badgePromotion")}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-label-md font-semibold text-primary line-clamp-2">{title}</h3>
                {excerpt && (
                  <p className="mt-1.5 font-body-sm text-[#434653] line-clamp-2">{excerpt}</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  {validUntil ? (
                    <span className="inline-flex items-center gap-1.5 font-label-sm text-[#747684]">
                      <Calendar className="h-4 w-4 shrink-0" />
                      {tNews("validUntil", { date: validUntil })}
                    </span>
                  ) : (
                    <span />
                  )}
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
