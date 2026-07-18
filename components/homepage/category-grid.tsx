import { getTranslations } from "next-intl/server";
import { Link } from "../../i18n/routing";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/products";

interface CategoryGridProps {
  locale: string;
}

export async function CategoryGrid({ locale }: CategoryGridProps) {
  const t = await getTranslations("CategoryGrid");

  const dbCategories = await prisma.category.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <section className="py-12 px-4 md:px-10 max-w-[1280px] mx-auto bg-white">
      <div className="text-center mb-12">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-primary mb-2">
          {t("title")}
        </h2>
        <div className="w-24 h-1 bg-[#3ca6fe] mx-auto rounded-full" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {dbCategories.map((cat) => {
          const title = pick(cat as unknown as Record<string, unknown>, "name", locale);
          const desc = pick(cat as unknown as Record<string, unknown>, "description", locale);
          return (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-xl aspect-[4/5] shadow-md hover:shadow-lg transition-all duration-300 block"
              style={{ boxShadow: "0 10px 30px -10px rgba(0, 64, 173, 0.08)" }}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundImage: `url(${cat.coverImage || ""})` }}
              />
              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#002c7d]/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-4 text-white z-10">
                <h3 className="font-headline-sm font-bold leading-tight">
                  {title}
                </h3>
                {desc && (
                  <p className="font-label-sm opacity-85 mt-1 leading-normal line-clamp-2">
                    {desc}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
