"use client";

import { useTranslations, useLocale } from "next-intl";
import { UniversalSlider, SlideItem } from "@/components/ui/universal-slider";

export function Hero() {
  const t = useTranslations("Hero");
  const locale = useLocale();

  const slides = [
    {
      tag: t("slides.0.tag"),
      title: t("slides.0.title"),
      desc: t("slides.0.desc"),
      bgUrl: "/api/uploads/hero-slide-1.jpg",
    },
    {
      tag: t("slides.1.tag"),
      title: t("slides.1.title"),
      desc: t("slides.1.desc"),
      bgUrl: "/api/uploads/hero-slide-2.jpg",
    }
  ];

  const slidesData: SlideItem[] = slides.map((slide, idx) => ({
    id: idx,
    title: slide.title,
    excerpt: slide.desc,
    tag: slide.tag,
    bgImage: slide.bgUrl,
    link: null,
    endDate: null,
  }));

  return (
    <section className="relative w-full overflow-hidden select-none bg-primary">
      <UniversalSlider
        slides={slidesData}
        locale={locale}
        showButtons={false}
        showTimer={false}
        heightClass="h-[400px] md:h-[480px]"
        autoplayInterval={5000}
        roundedClass="rounded-none"
        shadowClass="shadow-none"
      />
    </section>
  );
}
