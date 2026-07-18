import { ChevronRight } from "lucide-react";
import { Link } from "../../i18n/routing";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/products/product-card";

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
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                priceOnRequestLabel={tProducts("priceOnRequest")}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
