import { getTranslations } from "next-intl/server";
import { UniversalSlider, SlideItem } from "@/components/ui/universal-slider";
import { getPublishedHomepageBanners } from "@/lib/admin/banner-data";
import { pick } from "@/lib/products";

export async function Hero({ locale }: { locale: string }) {
  const banners = await getPublishedHomepageBanners();

  let slidesData: SlideItem[];
  if (banners.length > 0) {
    slidesData = banners.map((banner) => ({
      id: banner.id,
      title: pick(banner, "title", locale),
      excerpt: pick(banner, "description", locale) || null,
      tag: pick(banner, "subtitle", locale) || null,
      bgImage: banner.imageUrl,
      link: banner.linkUrl,
      ctaLabel: pick(banner, "buttonText", locale) || null,
      endDate: null,
    }));
  } else {
    // Fallback to the built-in copy so the homepage never renders an empty
    // banner before an admin has configured any slide in the panel.
    const t = await getTranslations("Hero");
    slidesData = [0, 1].map((i) => ({
      id: i,
      title: t(`slides.${i}.title`),
      excerpt: t(`slides.${i}.desc`),
      tag: t(`slides.${i}.tag`),
      bgImage: `/api/uploads/hero-slide-${i + 1}.jpg`,
      link: null,
      endDate: null,
    }));
  }

  return (
    <section className="relative w-full overflow-hidden select-none bg-primary">
      <UniversalSlider
        slides={slidesData}
        locale={locale}
        showButtons={true}
        showTimer={false}
        heightClass="h-[400px] md:h-[480px]"
        autoplayInterval={5000}
        roundedClass="rounded-none"
        shadowClass="shadow-none"
      />
    </section>
  );
}
