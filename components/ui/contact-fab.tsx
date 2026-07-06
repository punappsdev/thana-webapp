"use client";

import { useEffect, useState } from "react";
import { ArrowUp, MessageSquare, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

export function ContactFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const t = useTranslations("ContactFab");

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
      {/* FAB group — hover only on this area triggers expand */}
      <div
        className="flex flex-col items-end gap-3"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Expanding Stack */}
        <div
          className={`flex flex-col items-end gap-3 transition-all duration-500 ${
            isOpen
              ? "max-h-[300px] opacity-100 translate-y-0 scale-100 overflow-visible"
              : "max-h-0 opacity-0 translate-y-4 scale-95 pointer-events-none overflow-hidden"
          }`}
        >
          {/* LINE Button */}
          <div className="flex items-center justify-end relative group h-12 w-12">
            <span className="absolute right-14 bg-white text-[#0062a0] px-3 py-1.5 rounded-lg font-label-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 whitespace-nowrap pointer-events-none">
              {t("line")}
            </span>
            <a
              id="fab-link-line"
              href="https://line.me"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#06C755] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              {/* Custom LINE Icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M22 10.364c0-4.577-4.486-8.364-10-8.364s-10 3.787-10 8.364c0 4.1 3.568 7.525 8.389 8.217l-1.602 3.19c-.09.18.016.398.21.332l4.802-1.644c5.093-.244 8.201-3.647 8.201-8.455" />
              </svg>
            </a>
          </div>

          {/* Facebook Messenger Button */}
          <div className="flex items-center justify-end relative group h-12 w-12">
            <span className="absolute right-14 bg-white text-[#0062a0] px-3 py-1.5 rounded-lg font-label-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 whitespace-nowrap pointer-events-none">
              {t("messenger")}
            </span>
            <a
              id="fab-link-facebook"
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0084FF] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              {/* Custom Facebook Icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>

          {/* Telephone Button */}
          <div className="flex items-center justify-end relative group h-12 w-12">
            <span className="absolute right-14 bg-white text-[#0062a0] px-3 py-1.5 rounded-lg font-label-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 whitespace-nowrap pointer-events-none">
              {t("tel")}
            </span>
            <a
              id="fab-link-tel"
              href="tel:076381444"
              className="bg-[#002c7d] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              <Phone className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Main FAB Toggle Button */}
        <button
          id="fab-main-toggle"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#0062a0] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-500 cursor-pointer shrink-0"
          aria-label="Contact options"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      </div>

      {/* Scroll to Top — separate from FAB hover area, shows below FAB when scrolled */}
      <div
        className={`flex items-center justify-end relative group shrink-0 transition-all duration-500 ${
          showScrollTop
            ? "max-h-14 opacity-100 translate-y-0 scale-100 overflow-visible"
            : "max-h-0 opacity-0 translate-y-4 scale-95 pointer-events-none overflow-hidden"
        }`}
      >
        <span className="absolute right-14 bg-white text-[#0062a0] px-3 py-1.5 rounded-lg font-label-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 whitespace-nowrap pointer-events-none">
          {t("scrollTop")}
        </span>
        <button
          onClick={scrollToTop}
          aria-label={t("scrollTop")}
          className="bg-white text-[#0062a0] w-14 h-14 rounded-full flex items-center justify-center shadow-xl border border-[#c4e2f5] hover:scale-110 active:scale-95 transition-all duration-500 cursor-pointer"
        >
          <ArrowUp className="h-6 w-6 shrink-0" />
        </button>
      </div>
    </div>
  );
}
