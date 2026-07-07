"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { ChevronLeft, ChevronRight, Calendar, ArrowRight, Clock, Newspaper } from "lucide-react";
import { useTranslations } from "next-intl";

export interface SlideItem {
  id: string | number;
  title: string;
  excerpt?: string | null;
  tag?: string | null;
  bgImage?: string | null;
  link?: string | null;
  endDate?: Date | string | null;
}

interface UniversalSliderProps {
  slides: SlideItem[];
  locale: string;
  showButtons?: boolean;
  showTimer?: boolean;
  heightClass?: string; // e.g. "h-[400px] md:h-[480px]" or "h-[600px]"
  autoplayInterval?: number; // e.g. 5000 or 8000
  roundedClass?: string; // e.g. "rounded-2xl" or "rounded-none"
  shadowClass?: string; // e.g. "shadow-blue-lg" or "shadow-none"
}

// Separate component for Countdown Timer to manage its own state per slide
function CountdownTimer({
  endDate,
  locale,
  isMobileBadge = false,
}: {
  endDate: Date | string;
  locale: string;
  isMobileBadge?: boolean;
}) {
  const t = useTranslations("News");
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - Date.now();
      if (difference <= 0) {
        return null;
      }
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (!remaining) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  if (isMobileBadge) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-white/20 text-white px-2.5 py-1 rounded-md font-label-sm font-semibold text-[10px] tracking-wide backdrop-blur-xs border border-white/10">
        <Clock className="h-3 w-3 text-[#3ca6fe]" />
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}{String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
      </span>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-md border border-[#c4e2f5] p-3.5 rounded-xl shadow-blue-md max-w-xs animate-fade-in">
      <p className="font-label-sm font-bold text-primary mb-2 text-center flex items-center justify-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-secondary" />
        {locale === "en" ? "Limited Time Offer" : "เวลาที่เหลือสำหรับข้อเสนอนี้"}
      </p>
      <div className="flex gap-2 justify-center">
        {/* Days */}
        <div className="flex flex-col items-center">
          <div className="bg-primary text-white font-headline-sm font-bold rounded-lg px-2.5 py-1.5 min-w-[36px] text-center">
            {String(timeLeft.days).padStart(2, "0")}
          </div>
          <span className="font-label-sm text-[10px] text-muted-foreground mt-1">
            {locale === "en" ? "Days" : "วัน"}
          </span>
        </div>
        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="bg-primary text-white font-headline-sm font-bold rounded-lg px-2.5 py-1.5 min-w-[36px] text-center">
            {String(timeLeft.hours).padStart(2, "0")}
          </div>
          <span className="font-label-sm text-[10px] text-muted-foreground mt-1">
            {locale === "en" ? "Hrs" : "ชม."}
          </span>
        </div>
        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="bg-primary text-white font-headline-sm font-bold rounded-lg px-2.5 py-1.5 min-w-[36px] text-center">
            {String(timeLeft.minutes).padStart(2, "0")}
          </div>
          <span className="font-label-sm text-[10px] text-muted-foreground mt-1">
            {locale === "en" ? "Mins" : "นาที"}
          </span>
        </div>
        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="bg-secondary text-white font-headline-sm font-bold rounded-lg px-2.5 py-1.5 min-w-[36px] text-center">
            {String(timeLeft.seconds).padStart(2, "0")}
          </div>
          <span className="font-label-sm text-[10px] text-muted-foreground mt-1">
            {locale === "en" ? "Secs" : "วิ"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function UniversalSlider({
  slides,
  locale,
  showButtons = true,
  showTimer = true,
  heightClass = "h-[400px] md:h-[480px]",
  autoplayInterval = 8000,
  roundedClass = "rounded-2xl",
  shadowClass = "shadow-blue-lg",
}: UniversalSliderProps) {
  const t = useTranslations("News");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Auto-play interval
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, autoplayInterval);
    return () => clearInterval(timer);
  }, [slides.length, autoplayInterval]);

  if (slides.length === 0) {
    return (
      <div className="text-center py-16 bg-[#ffffff] border border-[#c4e2f5] rounded-2xl shadow-blue-sm">
        <p className="text-[#434653] font-body-lg font-medium">{t("noPromotions")}</p>
      </div>
    );
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const minSwipeDistance = 50;
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
    <div
      className={`relative w-full ${heightClass} ${roundedClass} ${shadowClass} overflow-hidden bg-primary select-none`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider container */}
      <div className="relative w-full h-full">
        {slides.map((slide, idx) => {
          const hasEndDate = !!slide.endDate && showTimer;
          const formattedEndDate = slide.endDate
            ? new Date(slide.endDate).toLocaleDateString(
                locale === "en" ? "en-US" : "th-TH",
                { year: "numeric", month: "short", day: "numeric" }
              )
            : "";
          const hasBottomContent = (showButtons && slide.link) || hasEndDate;
          const justifyClass = hasBottomContent ? "justify-between" : "justify-center";
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* Slide Layout: Background Image with Text Content Overlay */}
              <div className="relative w-full h-full">
                {/* Background Image */}
                <div className="absolute inset-0 z-0 bg-[#1e2235]">
                  {slide.bgImage ? (
                    <>
                      <Image
                        src={slide.bgImage}
                        alt={slide.title}
                        fill
                        className="object-cover"
                        sizes="100vw"
                        priority={idx === 0}
                      />
                      {/* Image dark gradient overlay to ensure text readability */}
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/35 via-primary/75 to-primary pointer-events-none md:bg-gradient-to-r md:from-primary/95 md:via-primary/70 md:to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/20">
                      <Newspaper className="h-16 w-16 text-white/25" />
                    </div>
                  )}
                </div>

                {/* Text Content and Countdown overlay wrapper */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  <div className={`max-w-[1280px] mx-auto px-4 md:px-10 h-full flex flex-col ${justifyClass} p-6 md:py-14 text-white relative pointer-events-auto`}>
                    <div className="space-y-3 w-full md:max-w-[55%]">
                      {/* Badge */}
                      {(slide.tag || hasEndDate) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {slide.tag && (
                            <span className="bg-secondary text-white font-label-sm font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[11px] md:text-xs">
                              {slide.tag}
                            </span>
                          )}
                          {hasEndDate && (
                            <>
                              <span className="flex items-center gap-1 text-white/95 font-label-sm font-medium text-[11px] md:text-xs">
                                <Calendar className="h-3.5 w-3.5" />
                                {t("validUntil", { date: formattedEndDate })}
                              </span>
                              {/* Mobile inline countdown timer badge */}
                              <div className="md:hidden">
                                <CountdownTimer endDate={slide.endDate!} locale={locale} isMobileBadge />
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="font-headline-lg-mobile md:font-display-md font-bold leading-snug md:leading-tight line-clamp-2 md:line-clamp-3">
                        {slide.title}
                      </h2>

                      {/* Excerpt */}
                      {slide.excerpt && (
                        <p className="text-white/85 font-body-md md:font-body-lg line-clamp-2 md:line-clamp-3 leading-relaxed font-light">
                          {slide.excerpt}
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    {showButtons && slide.link && (
                      <div className="py-4 md:py-6">
                        <Link
                          href={slide.link}
                          className="inline-flex items-center justify-center gap-2 h-9 md:h-11 px-5 md:px-8 font-label-sm font-semibold rounded-md shadow-lg bg-gradient-to-b from-[#078ee4] to-[#0040ad] hover:from-[#0040ad] hover:to-[#002c7d] text-white border-0 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          {t("readMore")}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    )}

                    {/* Overlapping Countdown Card on bottom-right of container (Desktop only) */}
                    {hasEndDate && (
                      <div className="hidden md:block absolute bottom-14 right-10 z-30">
                        <CountdownTimer endDate={slide.endDate!} locale={locale} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/25 text-white p-2.5 rounded-full transition-all border border-white/20 backdrop-blur-md shadow-md cursor-pointer items-center justify-center"
            aria-label="Previous promotion"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/25 text-white p-2.5 rounded-full transition-all border border-white/20 backdrop-blur-md shadow-md cursor-pointer items-center justify-center"
            aria-label="Next promotion"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicators - Centered at the bottom */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentSlide
                    ? "bg-white w-5"
                    : "bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
