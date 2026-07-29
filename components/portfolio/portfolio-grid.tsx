"use client";

import { useState } from "react";
import Image from "next/image";
import { Images } from "lucide-react";
import { useTranslations } from "next-intl";
import { WorkLightbox, type WorkImage } from "@/components/portfolio/work-lightbox";
import { cn } from "@/lib/utils";

export type PortfolioItem = {
  id: number;
  title: string;
  description: string | null;
  categoryName: string | null;
  coverImage: string | null;
  images: WorkImage[];
};

/**
 * The works grid. Cards with photos act as triggers for a single shared lightbox
 * instead of each mounting their own dialog.
 */
export function PortfolioGrid({ works }: { works: PortfolioItem[] }) {
  const t = useTranslations("Portfolio");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const activeWork = openIndex === null ? null : works[openIndex];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {works.map((work, index) => {
          const hasGallery = work.images.length > 0;
          const Wrapper = hasGallery ? "button" : "article";

          return (
            <Wrapper
              key={work.id}
              {...(hasGallery
                ? { type: "button" as const, onClick: () => setOpenIndex(index), "aria-label": `${t("viewGallery")}: ${work.title}` }
                : {})}
              className={cn(
                "group relative flex flex-col bg-white rounded-2xl border border-[#c4e2f5] shadow-blue-sm hover:shadow-blue-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden",
                hasGallery && "cursor-zoom-in text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              )}
            >
              {/* Top accent bar */}
              <span className="absolute top-0 left-0 h-1 w-0 bg-linear-to-r from-[#078ee4] to-primary group-hover:w-full transition-all duration-500" />

              {/* Cover Image */}
              {work.coverImage && (
                <div className="relative aspect-video w-full overflow-hidden bg-[#e2e2eb]">
                  <Image
                    src={work.coverImage}
                    alt={work.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {/* A single photo needs no count — the badge is there to signal
                      "there is more behind this card". */}
                  {work.images.length > 1 && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 font-label-sm text-white backdrop-blur-md">
                      <Images className="h-3.5 w-3.5" />
                      {t("photoCount", { count: work.images.length })}
                    </span>
                  )}
                </div>
              )}

              {/* Content Area */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Category Badge */}
                  {work.categoryName && (
                    <span className="inline-block bg-[#c4e2f5] text-[#002c7d] px-2.5 py-1 rounded-md font-label-sm font-medium">
                      {work.categoryName}
                    </span>
                  )}

                  {/* Title */}
                  <h2 className="font-headline-sm font-bold text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                    {work.title}
                  </h2>

                  {/* Description */}
                  {work.description && (
                    <p className="text-[#434653] font-body-sm line-clamp-3">
                      {work.description}
                    </p>
                  )}
                </div>
              </div>
            </Wrapper>
          );
        })}
      </div>

      {activeWork ? (
        <WorkLightbox
          key={activeWork.id}
          images={activeWork.images}
          title={activeWork.title}
          open
          onOpenChange={(next) => { if (!next) setOpenIndex(null); }}
          labels={{ prev: t("prevImage"), next: t("nextImage"), close: t("close") }}
        />
      ) : null}
    </>
  );
}
