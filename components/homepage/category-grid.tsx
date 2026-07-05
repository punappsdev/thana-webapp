"use client";

import { useTranslations } from "next-intl";
import { Link } from "../../i18n/routing";

export function CategoryGrid() {
  const t = useTranslations("CategoryGrid");

  const categories = [
    {
      title: t("items.aluminum.title"),
      desc: t("items.aluminum.desc"),
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9v3qDJdT2EZfs9G_2lfXHdn8Y8uNo5fu_7YJ9C6nN5gnqQkPbY5enVBgqS1DctovypiG0vwjhMrFGSrxY8JTfjorHX2tdlEU7_UrU6rbC9uZYu-KsAiio8qm2jjGLZgO6axaxMIgTnv1f9dWJdY_199ltZZCHUnaCCbGXR8g9tTfU5r8hbs3V4SiGZulEqG3Ii2KuhgwBL3JPpzgMe88rgPAAkLldwJI_b7za_Hc-Uj1PnQ3sHJ1y2RdQUtzTeaph8ZogLQfZFIQ",
    },
    {
      title: t("items.glass.title"),
      desc: t("items.glass.desc"),
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmaZZFgNzKKOBNOMRyzrsXhi54yijFRIJJmWF6kB93t2RlBEYZOLUm6L0w8nmZnZ1vKCtid8PYZExr_zdp7XDyJRPN9hj3VXk6PC8pgSsUZ3ymfPKCRMr3buYzIBSHt2QtKdnkVPlM5-NtvB2iMadSJlzXeUihLZSI4jS3ETElC84vMVaXqZmubR47bpKfuK42mScj4oDIeeMDgZdGjL1bddnNDKNzW_VYGT0XB3AewfvbVFAQNC_ADNsmGHV4mV7LILCjoVpBRX0",
    },
    {
      title: t("items.ceiling.title"),
      desc: t("items.ceiling.desc"),
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFm3fnILVBkhtrnXeA37jfjQwPEBkcrzxhpMRxwRhDlRC4Jy6Gntrbm2WJoF32vekjrs88FOLevA3Vem-8ZaC5FuCSh7HdEvAN8NA5mRiDL8jVskdV1t3YGYuHJGH7adfoGE0On0z4GEVANVGju1EQhxXbTM_tsHsk-xiguSX0okNz6B4si0v5S64n3kuHe5aTwXF1GrO2T3bz_5Vw5VGbmFR_cH0zj00rrhvxxA7DUpDX5_N2qHoN6D55bLkJMIQXqVeTVyoRko0",
    },
    {
      title: t("items.hardware.title"),
      desc: t("items.hardware.desc"),
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAIKnEZjoWNH5Pufpwtgdm6_hIsZillzqJSn8tfVhrIFVOAOXZ05POj2o4-9LLBQtqkKmCJiwt90P5wlyiqS31kMQrAhR0YKV3dCHGv5VUfanXU1u37pnf9soRbjj0YeO-em-OjVOgUIY7-FP7aDafUD_AkBYHYpqDSXYvE8rbuQds6nbI6n4g-w9Y793q1KLWDXCrSFj0lqOscwNNuvehVmR2lTmRNLiicRuv2YNqbiIsyMUwq1J6-xQxd-cpmbrGRBeuIEVt6a2k",
    },
  ];

  return (
    <section className="py-12 px-4 md:px-10 max-w-[1280px] mx-auto bg-white">
      <div className="text-center mb-12">
        <h2 className="text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
          {t("title")}
        </h2>
        <div className="w-24 h-1 bg-[#3ca6fe] mx-auto rounded-full" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, idx) => (
          <Link
            key={idx}
            href="#"
            className="group relative overflow-hidden rounded-xl aspect-[4/5] shadow-md hover:shadow-lg transition-all duration-300 block"
            style={{ boxShadow: "0 10px 30px -10px rgba(0, 64, 173, 0.08)" }}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
              style={{ backgroundImage: `url(${cat.imageUrl})` }}
            />
            {/* Gradient Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#002c7d]/80 via-transparent to-transparent" />
            
            <div className="absolute bottom-0 left-0 p-6 text-white z-10">
              <h3 className="text-headline-md font-bold">
                {cat.title}
              </h3>
              <p className="text-label-sm opacity-85 mt-1">
                {cat.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
