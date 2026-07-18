"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/routing";

/** Shared by the cart sheet and the full cart page so both read the same. */
export function CartEmptyState({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("Cart");

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f3fc]">
        <ShoppingCart className="h-7 w-7 text-primary" />
      </span>

      <div className="space-y-1">
        <p className="font-label-lg font-semibold text-on-surface">{t("empty")}</p>
        <p className="font-body-sm text-[#434653] max-w-xs">{t("emptyHint")}</p>
      </div>

      <Link
        href="/products"
        onClick={onNavigate}
        className="inline-flex items-center gap-2 rounded-md border border-primary px-5 py-2.5 font-label-md font-semibold text-primary transition-all hover:bg-[#f3f3fc]"
      >
        {t("browseProducts")}
      </Link>
    </div>
  );
}
