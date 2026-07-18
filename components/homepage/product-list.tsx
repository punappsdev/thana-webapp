import { ChevronRight, Package, ArrowRight } from "lucide-react";
import { Link } from "../../i18n/routing";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice, pick, priceRange } from "@/lib/products";

export async function ProductList({ locale }: { locale: string }) {
  const t = await getTranslations("ProductList");
  const tProducts = await getTranslations("Products");

  const products = await prisma.product.findMany({
    where: { published: true },
    include: {
      category: true,
      pricingUnit: true,
      variants: { select: { price: true } },
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    take: 4,
  });

  return (
    <section className="py-12 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-primary mb-2">
              {t("title")}
            </h2>
            <p className="font-body-md text-muted-foreground">{t("desc")}</p>
          </div>
          <Link
            href="/products"
            className="text-primary font-bold hover:underline flex items-center gap-1 font-label-sm shrink-0"
          >
            {t("viewAll")} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 border border-[#c4e2f5] rounded-xl">
            <p className="font-body-md text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const name = pick(product, "name", locale);
              const description = pick(product, "description", locale);
              const range = priceRange(product.variants);
              const basePrice = product.basePrice ? Number(product.basePrice) : null;
              const price = range ? range.min : basePrice;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="bg-white rounded-xl overflow-hidden group transition-all duration-300 border border-border/50 flex flex-col"
                  style={{ boxShadow: "0 10px 30px -10px rgba(0, 64, 173, 0.08)" }}
                >
                  <div className="relative overflow-hidden aspect-square bg-[#e2e2eb]">
                    {product.coverImage ? (
                      <Image
                        src={product.coverImage}
                        alt={name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-10 w-10 text-[#747684]" />
                      </div>
                    )}
                    <span className="absolute inset-0 bg-primary/5 pointer-events-none" />
                    {product.featured && (
                      <span className="absolute top-4 left-4 bg-[#621900] text-white font-label-sm font-bold px-3 py-1 rounded-full">
                        {product.category ? pick(product.category, "name", locale) : ""}
                      </span>
                    )}
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
                            {tProducts("priceOnRequest")}
                          </span>
                        )}
                      </div>
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
            })}
          </div>
        )}
      </div>
    </section>
  );
}
