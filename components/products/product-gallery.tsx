"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = { url: string; alt: string };

export function ProductGallery({ images, locale }: { images: GalleryImage[]; locale: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const count = images.length;

  const labels = locale === "en"
    ? { prev: "Previous image", next: "Next image", close: "Close", zoom: "View larger image" }
    : { prev: "รูปก่อนหน้า", next: "รูปถัดไป", close: "ปิด", zoom: "ดูภาพขนาดใหญ่" };

  const go = (delta: number) => setActive((current) => (current + delta + count) % count);

  if (count === 0) {
    return (
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-[#c4e2f5] bg-[#e2e2eb] shadow-blue-sm">
        <div className="flex h-full w-full items-center justify-center">
          <Package className="h-14 w-14 text-[#747684]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.zoom}
        className="group relative block aspect-4/3 w-full cursor-zoom-in overflow-hidden rounded-2xl border border-[#c4e2f5] bg-[#e2e2eb] shadow-blue-sm"
      >
        <Image
          src={images[active].url}
          alt={images[active].alt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <span className="absolute inset-0 bg-primary/5" />
      </button>

      {count > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.slice(0, 5).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={img.alt}
              aria-current={i === active}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border bg-[#e2e2eb] transition",
                i === active ? "border-primary ring-2 ring-primary/40" : "border-[#c4e2f5] hover:border-primary/50",
              )}
            >
              <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="120px" />
            </button>
          ))}
        </div>
      )}

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
              if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none sm:p-8"
          >
            <DialogPrimitive.Title className="sr-only">{images[active].alt}</DialogPrimitive.Title>

            <div className="relative h-[80vh] w-full max-w-5xl">
              <Image src={images[active].url} alt={images[active].alt} fill className="object-contain" sizes="100vw" />
            </div>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label={labels.prev}
                  className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:left-6"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label={labels.next}
                  className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-6"
                >
                  <ChevronRight className="size-6" />
                </button>
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 font-label-sm text-white backdrop-blur">
                  {active + 1} / {count}
                </div>
              </>
            )}

            <DialogPrimitive.Close
              aria-label={labels.close}
              className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-6 sm:top-6"
            >
              <X className="size-6" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
