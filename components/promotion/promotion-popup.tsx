"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { X } from "lucide-react";
import { useConsent } from "@/components/consent/use-consent";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { isWithinSchedule, markPopupSeen, popupSignature, shouldShowPopup } from "@/lib/popup-visibility";
import type { ActivePopup } from "@/lib/admin/popup-data";

/** Long enough to stay out of the hero's LCP, short enough to still feel intentional. */
const OPEN_DELAY_MS = 800;

export function PromotionPopup({ popup, locale }: { popup: ActivePopup; locale: string }) {
  const t = useTranslations("Popup");
  const { analytics, hydrated: consentHydrated } = useConsent();
  // Always closed on the server and on the first client render, so the markup
  // matches and the storage check below never causes a hydration mismatch.
  const [open, setOpen] = useState(false);

  const signature = popupSignature(popup.id, popup.updatedAt);

  useEffect(() => {
    // Let the visitor make the first privacy choice without another modal
    // competing for focus. Once a choice exists, the promotion follows normally.
    if (!consentHydrated || analytics === "unset") return;
    if (!isWithinSchedule(popup.startDate, popup.endDate)) return;
    if (!shouldShowPopup(signature, popup.frequency)) return;
    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [
    analytics,
    consentHydrated,
    signature,
    popup.frequency,
    popup.startDate,
    popup.endDate,
  ]);

  const dismiss = () => {
    markPopupSeen(signature, popup.frequency);
    setOpen(false);
  };

  const alt = (locale === "en" ? popup.altEn : popup.altTh) || t("title");
  const image = (
    <Image
      src={popup.imageUrl}
      alt={alt}
      width={popup.width}
      height={popup.height}
      sizes="(max-width: 640px) 94vw, (max-width: 1200px) 92vw, 1100px"
      // max-h keeps a taller-than-expected upload from running off the viewport.
      className="h-auto max-h-[90dvh] w-full object-contain"
    />
  );

  const isExternal = /^https?:\/\//i.test(popup.linkUrl ?? "");

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss(); }}>
      <DialogContent showCloseButton={false} className="w-[94vw] gap-0 overflow-hidden p-0 sm:w-[92vw] sm:max-w-[1100px]">
        {/* Image-only creative: Radix still requires a title and description for
            screen readers, so both are visually hidden. */}
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <DialogDescription className="sr-only">{t("description")}</DialogDescription>
        {/* The default ghost close button would disappear against a bright
            creative, so this one carries its own scrim. */}
        <DialogClose
          aria-label={t("close")}
          className="absolute top-2.5 right-2.5 z-10 flex size-8 items-center justify-center rounded-full bg-foreground/55 text-background backdrop-blur-xs transition-colors hover:bg-foreground/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
        >
          <X className="size-4" />
        </DialogClose>
        {popup.linkUrl ? (
          isExternal ? (
            <a href={popup.linkUrl} target="_blank" rel="noopener noreferrer" onClick={dismiss} aria-label={alt}>
              {image}
            </a>
          ) : (
            <Link href={popup.linkUrl} onClick={dismiss} aria-label={alt}>
              {image}
            </Link>
          )
        ) : (
          image
        )}
      </DialogContent>
    </Dialog>
  );
}
