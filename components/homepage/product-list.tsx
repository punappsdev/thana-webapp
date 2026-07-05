"use client";

import { ChevronRight, ShoppingCart } from "lucide-react";
import { Link } from "../../i18n/routing";
import { useTranslations } from "next-intl";

export function ProductList() {
  const t = useTranslations("ProductList");

  const products = [
    {
      title: t("products.0.title"),
      desc: t("products.0.desc"),
      price: t("products.0.price"),
      tag: t("products.0.tag"),
      tagBg: "bg-[#621900]",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAO7ON0rcdGH4N6v-t5JyxhlsSmTNH-GlBmn4o5GtyzjblC7E1gYoQjChOu3Do0U_RiOkLQW5FJWh_FMx-kXwhBAu3FF534NmkOpgg8kQg_4AWy8Bq-Oe4HlrFqnPs7Z2Y9DCxcSrH8IU_TsVJrQ86ps-6xLhIkzCyVL-UyQO4FZ03wNEudHHXU63dpnKrr_C1w_ThuQxRPZ36RgT93MoeRp3kzsLdXnPVXMbrm5PFdiZdngJeMq9HJ3uMhdSABscHAOxYNnfqPc0Y",
    },
    {
      title: t("products.1.title"),
      desc: t("products.1.desc"),
      price: t("products.1.price"),
      tag: t("products.1.tag"),
      tagBg: "bg-[#0062a0]",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDfTilJsRx64PVVHt0L7GM11D9M6ikv76uXiOlrlEYZbSkUmGt6JftWwIqhKFc2x8YPEGYhlxd7yp6SP4-697gzMf1ZUtahBdxYgkgHV6YW416CScKWeGRkmv3lQLCou5G586ZKZ-w-Q6n8EpwZhkmi2RO1ujvkenyRAkyMUDYec1gNKqX2p_2vA_AwdKMmWxsCKugU1YGEmSt9bNN7NDDLe_ocHD2eYNiVLhVLx6bVt8PsxQxxe30-rE4xT1fThy9B9FE0cevasow",
    },
    {
      title: t("products.2.title"),
      desc: t("products.2.desc"),
      price: t("products.2.price"),
      tag: t("products.2.tag"),
      tagBg: "",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYCB64Gd4ImWJP0o-gNGCdDsf7JakLTlNMe0PIgLmsr3Y5QH5EzG_mMsJHHlkK00P3y0yLrPXh5Jg8EksywZ9iKbKtaW8fymrbpsqSu4PG8FS_DPqQDT2m3ilIWtl5tVEQHslfZf_YlwC2I3mJaxapkx0j4JWUh8K8CYHw1M-sJAvn5q438bhbniSn0HHSMO-st_Sd0SxdFnvE-2pFfxKaghkXQfshUyZbgkdUab_teGY9sOkdAcqqJQs8X_6qE7dNh-k4O42RblQ",
    },
    {
      title: t("products.3.title"),
      desc: t("products.3.desc"),
      price: t("products.3.price"),
      tag: t("products.3.tag"),
      tagBg: "",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0K9gYU35jEZLC0ZA8fy3ZLffsZakkcbzzN0qY8H129rJUhZNH_rLxVoPHGClV_vHXCo72QgSWbnvFzqqzLjxNRJpz2Rd564kvkSAqatly8VXBnxaAx7LmmLkBTkhXJbzPJczF1DGuHoM0rtilA6lfDmuT-9PMK1vj3J1TYIhM1iwylcwPe_OlmN8MUFIUcCdMk2DZICebz7U5JKIr64_O4-OrNWL7TI3xb7glEDn9vcjOD5UHgBLQlmSGx4AAckVW4-a7KInYJR0",
    },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
              {t("title")}
            </h2>
            <p className="text-body-md text-muted-foreground">
              {t("desc")}
            </p>
          </div>
          <Link
            href="#"
            className="text-primary font-bold hover:underline flex items-center gap-1 font-sans text-sm"
          >
            {t("viewAll")} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl overflow-hidden group transition-all duration-300 border border-border/50"
              style={{ boxShadow: "0 10px 30px -10px rgba(0, 64, 173, 0.08)" }}
            >
              <div className="relative overflow-hidden aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prod.imageUrl}
                  alt={prod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {prod.tag && (
                  <span
                    className={`absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full ${prod.tagBg}`}
                  >
                    {prod.tag}
                  </span>
                )}
              </div>
              <div className="p-6">
                <h4 className="text-body-lg text-primary mb-2 font-semibold">
                  {prod.title}
                </h4>
                <p className="text-body-md text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                  {prod.desc}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-secondary font-sans">
                    {prod.price}
                  </span>
                  <button
                    className="p-2 rounded-full border border-primary-container text-primary hover:bg-primary-container hover:text-white transition-all cursor-pointer"
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
