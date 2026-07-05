"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const t = useTranslations("Hero");

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

  // Auto-play interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  // Touch Swipe Handlers for Mobile
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <section 
      className="relative h-[600px] w-full overflow-hidden bg-[#002c7d]/90 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Carousel slides container */}
      <div className="relative w-full h-full">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
              idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {/* Background Image overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.bgUrl})` }}
            />
            {/* Hero Gradient Filter */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#002c7d]/40 to-[#002c7d]/85" />

            <div className="relative z-10 h-full flex flex-col justify-center px-4 md:px-10 max-w-[1280px] mx-auto text-white">
              <span className="text-label-sm bg-[#3ca6fe]/20 backdrop-blur-md px-4 py-2 rounded-full w-fit mb-6 tracking-wide">
                {slide.tag}
              </span>
              <h1 className="text-headline-lg-mobile md:text-display-lg max-w-2xl mb-6">
                {slide.title}
              </h1>
              <p className="text-body-md md:text-body-lg max-w-xl mb-8 opacity-90">
                {slide.desc}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="h-11 px-8 text-label-sm font-semibold rounded-md shadow-lg bg-gradient-to-b from-[#078ee4] to-[#0040ad] hover:from-[#0040ad] hover:to-[#002c7d] text-white border-0 transition-all duration-300 cursor-pointer">
                  {t("btnProjects")}
                </Button>
                <Button variant="outline" className="h-11 px-8 text-label-sm font-semibold rounded-md border-white/40 text-white bg-transparent hover:bg-white/10 hover:text-white transition-all cursor-pointer">
                  {t("btnConsult")}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows (Visible on all sizes, smaller on mobile) */}
      <button
        onClick={prevSlide}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/25 hover:bg-black/50 text-white p-1.5 md:p-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center border border-white/10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/25 hover:bg-black/50 text-white p-1.5 md:p-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center border border-white/10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      {/* Carousel indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
              idx === currentSlide ? "bg-white ring-4 ring-white/30" : "bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
