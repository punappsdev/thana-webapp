import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/products";

export async function Partners({ locale }: { locale: string }) {
  const t = await getTranslations("Partners");

  const brands = await prisma.brand.findMany({
    where: { logo: { not: null } },
    orderBy: { nameTh: "asc" },
  });

  // With no logos uploaded there is nothing to show, so hide the whole block
  // instead of rendering an empty marquee.
  if (brands.length === 0) return null;

  // Duplicate list to achieve infinite seamless loop
  const doubleBrands = [...brands, ...brands];

  return (
    <section className="py-16 bg-background overflow-hidden border-t border-border/20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 mb-10 text-center">
        <span className="font-label-sm text-secondary font-bold tracking-wider mb-3 block">
          {t("tag")}
        </span>
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-primary mb-4">
          {t("title")}
        </h2>
        <p className="font-body-md text-muted-foreground max-w-2xl mx-auto">
          {t("desc")}
        </p>
      </div>

      <div className="relative w-full py-4">
        {/* Sleek fade out effects for glass theme */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex w-max animate-marquee marquee-pause gap-6 md:gap-8">
          {doubleBrands.map((brand, index) => (
            <div
              key={`${brand.id}-${index}`}
              className="flex items-center justify-center bg-white dark:bg-card border border-border/40 rounded-xl px-6 md:px-8 py-5 h-20 min-w-[150px] md:min-w-[180px] shadow-blue-sm transition-all duration-300 hover:border-primary/30 hover:shadow-blue-md hover:scale-105 cursor-pointer opacity-95 hover:opacity-100"
            >
              <Image
                src={brand.logo!}
                alt={pick(brand, "name", locale)}
                width={180}
                height={64}
                className="h-12 md:h-14 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
