import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/products/product-card";
import { ProductListCarousel } from "@/components/homepage/product-list-carousel";

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
      <div className="max-w-7xl mx-auto px-4 md:px-14 lg:px-16">
        <ProductListCarousel
          title={t("title")}
          desc={t("desc")}
          viewAllLabel={t("viewAll")}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[78%] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-2*24px)/3)] lg:w-[calc((100%-3*24px)/4)] shrink-0 snap-start flex flex-col"
            >
              <ProductCard
                product={product}
                locale={locale}
                viewDetailLabel={tProducts("viewDetail")}
                skuLabel={tProducts("sku")}
                optionsLabel={tProducts("options")}
                sizes="(max-width: 640px) 80vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
          ))}
        </ProductListCarousel>
      </div>
    </section>
  );
}


