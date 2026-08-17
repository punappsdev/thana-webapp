import { getTranslations } from "next-intl/server";
import { Link } from "../../i18n/routing";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/products";
import { richTextToPlainText } from "@/lib/rich-text";

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

      {/* auto-fit collapses the empty tracks, so the row stays full whether the
          catalog has five categories or eight — no column count to keep in sync. */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:justify-center lg:[grid-template-columns:repeat(auto-fit,minmax(180px,220px))]">
        {dbCategories.map((cat) => {
          const title = pick(cat as unknown as Record<string, unknown>, "name", locale);
          // Descriptions are rich text now; strip the HTML so the card excerpt
          // shows plain text instead of raw tags.
          const desc = richTextToPlainText(pick(cat as unknown as Record<string, unknown>, "description", locale));
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
