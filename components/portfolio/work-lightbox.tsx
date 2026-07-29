"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type WorkImage = { url: string; alt: string };

/** Distance a touch has to travel before it counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 50;

/**
 * Full-screen photo viewer for one work. Built on the raw Radix Dialog primitive
 * (like ProductGallery) because the shadcn DialogContent caps its width for
 * regular modals — a lightbox needs the whole viewport.
 */
export function WorkLightbox({
  images,
  title,
  open,
  onOpenChange,
  labels,
}: {
  images: WorkImage[];
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: { prev: string; next: string; close: string };
}) {
  // Callers mount this per open work (keyed by id), so `active` starts at the
  // first photo every time without an effect resetting it.
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;

  if (count === 0) return null;

  const go = (delta: number) => setActive((current) => (current + delta + count) % count);
  const current = images[Math.min(active, count - 1)];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
            if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
          }}
          onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            const startX = touchStartX.current;
            touchStartX.current = null;
            if (startX === null || count < 2) return;
            const deltaX = (event.changedTouches[0]?.clientX ?? startX) - startX;
            if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
            go(deltaX < 0 ? 1 : -1);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none sm:p-8"
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>

          <div className="relative h-[80vh] w-full max-w-5xl">
            <Image src={current.url} alt={current.alt} fill className="object-contain" sizes="100vw" priority />
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
  );
}
