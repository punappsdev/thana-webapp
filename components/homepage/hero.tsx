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
      bgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpuv1wzKW-b1lE96I_nXunsKVh55WMx0wT_slAgGY-UY2YeTqIsPZKevnnS4fj36AuyxKLUSGk2IB0fnRTbTgbcWcOEbCoQ-eTPi-HVDPv3g83cJrVX_3t2SRiTRLG0-kWZfR-anDy7DTtJLa0sAMcFzmcfVP14qla3e-ImUkA64oPIzcny_qsoM0G-DAF5npEabst8vjU3gi00mY7I4_1N2riYp7WagqGD6_Zocs0UL9sOSXLFWNIls559PjqxhIjWvTlT8mKVVA",
    },
    {
      tag: t("slides.1.tag"),
      title: t("slides.1.title"),
      desc: t("slides.1.desc"),
      bgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmaZZFgNzKKOBNOMRyzrsXhi54yijFRIJJmWF6kB93t2RlBEYZOLUm6L0w8nmZnZ1vKCtid8PYZExr_zdp7XDyJRPN9hj3VXk6PC8pgSsUZ3ymfPKCRMr3buYzIBSHt2QtKdnkVPlM5-NtvB2iMadSJlzXeUihLZSI4jS3ETElC84vMVaXqZmubR47bpKfuK42mScj4oDIeeMDgZdGjL1bddnNDKNzW_VYGT0XB3AewfvbVFAQNC_ADNsmGHV4mV7LILCjoVpBRX0",
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
