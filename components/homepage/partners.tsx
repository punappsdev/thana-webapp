"use client";

import { useTranslations } from "next-intl";

const AGCLogo = () => (
  <svg className="h-6 md:h-7 w-auto text-[#005ea6]" viewBox="0 0 120 40" fill="currentColor">
    <path d="M25 30 L30 10 L38 10 L43 30 L37 30 L35.5 24 L27.5 24 L26 30 Z M28.5 20 L34.5 20 L31.5 12 Z" />
    <path d="M57 26 C54 31 46 31 43 26 C40 22 40 18 43 14 C46 9 54 9 57 14 L51 16.5 C50 14.5 48 14.5 47 15.5 C45 17 45 23 47 24.5 C48 25.5 50 25.5 51 23.5 L51 21 L47.5 21 L47.5 18 L57 18 Z" />
    <path d="M72 26 C75 22 75 18 72 14 C69 9 61 9 58 14 C55 18 55 22 58 26 C61 31 69 31 72 26 Z M62.5 14.5 C64.5 12 65.5 12 67.5 14.5 C69.5 17.5 69.5 22.5 67.5 25.5 C65.5 28 64.5 28 62.5 25.5 C60.5 22.5 60.5 17.5 62.5 14.5 Z" />
    <rect x="78" y="10" width="4" height="20" className="fill-sky-500" />
  </svg>
);

const GuardianLogo = () => (
  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
    <svg className="h-6 md:h-7 w-auto fill-current text-[#213346] dark:text-[#a0b6ff]" viewBox="0 0 32 32">
      <path d="M16 2 L4 6 V16 C4 23.5 16 30 16 30 C16 30 28 23.5 28 16 V6 L16 2 Z M16 26 C16 26 8 21.2 8 16 V8.4 L16 5.6 L24 8.4 V16 C24 21.2 16 26 16 26 Z" />
    </svg>
    <span className="font-sans font-extrabold tracking-wider font-label-md text-slate-800 dark:text-white">GUARDIAN</span>
  </div>
);

const SaintGobainLogo = () => (
  <div className="flex items-center gap-2">
    <svg className="h-6 md:h-7 w-auto fill-none" viewBox="0 0 40 24">
      <path d="M2 20 C2 12 8 12 8 20" stroke="#009fd9" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 20 C8 12 14 12 14 20" stroke="#00a07a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 20 C14 12 20 12 20 20" stroke="#f29400" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 20 C20 12 26 12 26 20" stroke="#e30613" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 20 C26 12 32 12 32 20" stroke="#96167c" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 20 L38 20" stroke="#5c6670" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
    <span className="font-sans font-bold tracking-tight font-label-sm md:font-label-md text-slate-800 dark:text-slate-200">SAINT-GOBAIN</span>
  </div>
);

const TostemLogo = () => (
  <span className="font-sans font-black tracking-widest text-[#0b2d64] dark:text-[#b4c5ff] font-headline-sm md:font-headline-md">TOSTEM</span>
);

const YkkApLogo = () => (
  <div className="flex items-center gap-1.5">
    <span className="font-sans font-black text-blue-900 dark:text-sky-300 font-headline-sm md:font-headline-md tracking-tighter">YKK</span>
    <span className="bg-sky-600 text-white font-sans font-bold px-1.5 py-0.5 rounded-sm font-label-sm tracking-widest">AP</span>
  </div>
);

const HafeleLogo = () => (
  <span className="font-sans font-bold tracking-widest text-[#d8232a] dark:text-red-500 font-headline-sm md:font-headline-md italic">HÄFELE</span>
);

const SchucoLogo = () => (
  <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200">
    <span className="font-sans font-black tracking-wide font-headline-sm md:font-headline-md text-slate-900 dark:text-white">SCHÜCO</span>
    <div className="w-2.5 h-2.5 rounded-full bg-[#7cb813]" />
  </div>
);

const LixilLogo = () => (
  <div className="flex items-center gap-1.5 border border-[#ff6600] px-2 py-0.5 rounded-sm">
    <span className="font-sans font-extrabold tracking-widest text-[#ff6600] dark:text-orange-400 font-label-sm md:font-label-md">LIXIL</span>
  </div>
);

export function Partners() {
  const t = useTranslations("Partners");

  const partnersList = [
    { id: "agc", component: <AGCLogo /> },
    { id: "guardian", component: <GuardianLogo /> },
    { id: "saintgobain", component: <SaintGobainLogo /> },
    { id: "tostem", component: <TostemLogo /> },
    { id: "ykkap", component: <YkkApLogo /> },
    { id: "hafele", component: <HafeleLogo /> },
    { id: "schuco", component: <SchucoLogo /> },
    { id: "lixil", component: <LixilLogo /> },
  ];

  // Duplicate list to achieve infinite seamless loop
  const doublePartners = [...partnersList, ...partnersList];

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
          {doublePartners.map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className="flex items-center justify-center bg-white dark:bg-card border border-border/40 rounded-xl px-6 md:px-8 py-5 h-20 min-w-[150px] md:min-w-[180px] shadow-blue-sm transition-all duration-300 hover:border-primary/30 hover:shadow-blue-md hover:scale-105 cursor-pointer opacity-95 hover:opacity-100"
            >
              {partner.component}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
