import { ChevronRight } from "lucide-react";
import { Link } from "../../i18n/routing";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/products/product-card";

export async function ProductList({ locale }: { locale: string }) {
  const t = await getTranslations("ProductList");
  const tProducts = await getTranslations("Products");

  const products = await prisma.product.findMany({
    where: { published: true, featured: true },
    include: {
      category: true,
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
    orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
    take: 8,
  });

  // The section is curated from /admin/featured — with nothing selected there is
  // nothing to feature, so hide the whole block instead of showing an empty box.
  if (products.length === 0) return null;

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              viewDetailLabel={tProducts("viewDetail")}
              skuLabel={tProducts("sku")}
              optionsLabel={tProducts("options")}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
