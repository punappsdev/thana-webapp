"use client";

import { Phone, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function CtaSection() {
  const t = useTranslations("CtaSection");

  return (
    <section className="py-12 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="bg-primary-container rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-lg">
          {/* Dot Pattern Background Overlay */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px"
            }}
          />
          
          <h2 className="font-headline-lg-mobile md:font-headline-lg mb-4 relative z-10">
            {t("title")}
          </h2>
          <p className="font-body-md md:font-body-lg max-w-2xl mx-auto mb-10 opacity-90 relative z-10">
            {t("desc")}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <a
              id="cta-tel-link"
              href="tel:076381444"
              className="bg-white text-primary px-8 py-4 rounded-lg font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 font-label-sm shadow-md"
            >
              <Phone className="h-4 w-4" /> {t("call")}
            </a>
            <a
              id="cta-line-link"
              href="https://line.me"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 font-label-sm"
            >
              <MessageCircle className="h-4 w-4" /> {t("line")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
