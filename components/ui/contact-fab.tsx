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
              href="https://lin.ee/P3ZGgWM"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#06C755] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              {/* Custom LINE Icon */}
              <svg viewBox="0 0 30 30" fill="currentColor" className="h-7 w-7">
                <path d="M 6 4 C 4.895 4 4 4.895 4 6 L 4 24 C 4 25.105 4.895 26 6 26 L 24 26 C 25.105 26 26 25.105 26 24 L 26 6 C 26 4.895 25.105 4 24 4 L 6 4 z M 15.003906 7.6660156 C 19.720906 7.6660156 23.558594 10.780375 23.558594 14.609375 C 23.558594 16.142375 22.964609 17.523813 21.724609 18.882812 C 19.929609 20.948812 15.916906 23.464609 15.003906 23.849609 C 14.091906 24.233609 14.225719 23.604672 14.261719 23.388672 C 14.283719 23.260672 14.384766 22.65625 14.384766 22.65625 C 14.413766 22.43725 14.442469 22.099812 14.355469 21.882812 C 14.258469 21.645813 13.880563 21.520937 13.601562 21.460938 C 9.4895625 20.916937 6.4472656 18.041375 6.4472656 14.609375 C 6.4472656 10.781375 10.286906 7.6660156 15.003906 7.6660156 z M 12.626953 12.910156 C 12.375953 12.910156 12.171875 13.107656 12.171875 13.347656 L 12.171875 16.652344 C 12.171875 16.894344 12.375953 17.089844 12.626953 17.089844 C 12.877953 17.089844 13.082031 16.893344 13.082031 16.652344 L 13.082031 13.347656 C 13.082031 13.107656 12.877953 12.910156 12.626953 12.910156 z M 14.5625 12.910156 C 14.5175 12.910156 14.470781 12.915641 14.425781 12.931641 C 14.248781 12.991641 14.128906 13.157703 14.128906 13.345703 L 14.128906 16.650391 C 14.128906 16.892391 14.3225 17.089844 14.5625 17.089844 C 14.8025 17.089844 14.996094 16.890391 14.996094 16.650391 L 14.996094 14.605469 L 16.679688 16.914062 C 16.760687 17.024063 16.889391 17.089844 17.025391 17.089844 C 17.072391 17.089844 17.118109 17.082406 17.162109 17.066406 C 17.340109 17.006406 17.460938 16.840344 17.460938 16.652344 L 17.457031 16.652344 L 17.457031 13.347656 C 17.457031 13.107656 17.263391 12.910156 17.025391 12.910156 C 16.787391 12.910156 16.591797 13.107656 16.591797 13.347656 L 16.591797 15.392578 L 14.908203 13.085938 C 14.827203 12.975938 14.6985 12.910156 14.5625 12.910156 z M 18.929688 12.910156 C 18.678688 12.910156 18.474609 13.107656 18.474609 13.347656 L 18.474609 14.998047 L 18.474609 15 L 18.474609 16.650391 C 18.474609 16.892391 18.678687 17.089844 18.929688 17.089844 L 20.654297 17.089844 C 20.906297 17.089844 21.111328 16.892344 21.111328 16.652344 C 21.111328 16.412344 20.905297 16.216797 20.654297 16.216797 L 19.384766 16.216797 L 19.384766 15.435547 L 20.654297 15.435547 C 20.906297 15.435547 21.111328 15.24 21.111328 15 C 21.111328 14.758 20.905297 14.5625 20.654297 14.5625 L 19.384766 14.564453 L 19.384766 13.783203 L 20.654297 13.783203 C 20.906297 13.783203 21.111328 13.588656 21.111328 13.347656 C 21.111328 13.107656 20.905297 12.910156 20.654297 12.910156 L 18.929688 12.910156 z M 9.34375 12.912109 C 9.09275 12.912109 8.8886719 13.106656 8.8886719 13.347656 L 8.8886719 16.652344 C 8.8886719 16.894344 9.09275 17.089844 9.34375 17.089844 L 11.068359 17.089844 C 11.320359 17.089844 11.522438 16.893297 11.523438 16.654297 C 11.523437 16.414297 11.319359 16.21875 11.068359 16.21875 L 9.7988281 16.21875 L 9.7988281 13.347656 C 9.7988281 13.107656 9.59475 12.912109 9.34375 12.912109 z" />
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
              href="https://www.facebook.com/thanachaihq"
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
