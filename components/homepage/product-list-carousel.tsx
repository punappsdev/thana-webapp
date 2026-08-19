"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";

interface ProductListCarouselProps {
  children: ReactNode;
  title: string;
  desc: string;
  viewAllLabel: string;
}

export function ProductListCarousel({
  children,
  title,
  desc,
  viewAllLabel,
}: ProductListCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > 4);
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollState();

    const handleResize = () => {
      updateScrollState();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollState]);

  const scrollPrev = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth;
    el.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollNext = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Header section with Title and View All link */}
      <div className="flex justify-between items-end mb-6 md:mb-8">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-primary mb-2">
            {title}
          </h2>
          <p className="font-body-md text-muted-foreground">{desc}</p>
        </div>

        <Link
          href="/products"
          className="text-primary font-bold hover:underline flex items-center gap-1 font-label-sm shrink-0"
        >
          {viewAllLabel} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Carousel Wrapper with outer side navigation buttons */}
      <div className="relative">
        {/* Left / Prev floating button placed outside the cards in the margin */}
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          aria-label="Previous products"
          className={`hidden md:flex absolute -left-10 lg:-left-12 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full border border-border/70 bg-white text-primary shadow-blue-md items-center justify-center transition-all duration-200 hover:bg-primary hover:text-white hover:border-primary hover:scale-105 active:scale-95 cursor-pointer ${
            canScrollPrev
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Right / Next floating button placed outside the cards in the margin */}
        <button
          type="button"
          onClick={scrollNext}
          disabled={!canScrollNext}
          aria-label="Next products"
          className={`hidden md:flex absolute -right-10 lg:-right-12 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full border border-border/70 bg-white text-primary shadow-blue-md items-center justify-center transition-all duration-200 hover:bg-primary hover:text-white hover:border-primary hover:scale-105 active:scale-95 cursor-pointer ${
            canScrollNext
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollState}
          className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 -my-4 px-1 -mx-1 scrollbar-none [&::-webkit-scrollbar]:hidden overscroll-x-contain"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
