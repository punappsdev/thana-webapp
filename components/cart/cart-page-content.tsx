"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, MessageSquareQuote, Trash2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { formatPrice } from "@/lib/products";
import { lineKey } from "@/lib/cart";
import { useCart } from "./use-cart";
import { CartLineRow } from "./cart-line-row";
import { CartEmptyState } from "./cart-empty-state";

export function CartPageContent() {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const { items, count, subtotal, hydrated, clear } = useCart();

  // The cart only exists in the browser, so the server renders nothing here and
  // the first client paint fills it in. A skeleton avoids an empty-state flash.
  if (!hydrated) {
    return (
      <div className="space-y-4" aria-hidden>
        {[0, 1].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-[#f3f3fc]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-[#c4e2f5] bg-white">
        <CartEmptyState />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="rounded-lg border border-[#c4e2f5] bg-white px-5">
          <div className="divide-y divide-[#e2e2eb]">
            {items.map((item) => (
              <CartLineRow key={lineKey(item)} item={item} layout="page" />
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 font-label-md font-medium text-primary transition-colors hover:text-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("continueShopping")}
          </Link>

          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 font-label-sm font-medium text-[#747684] transition-colors hover:bg-[#ffdad6] hover:text-[#ba1a1a] cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            {t("clear")}
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="space-y-4 rounded-lg border border-[#c4e2f5] bg-[#f3f3fc] p-6">
          <h2 className="font-headline-sm font-semibold text-on-surface">{t("title")}</h2>

          <div className="flex items-baseline justify-between">
            <span className="font-body-sm text-[#434653]">{t("itemCount", { count })}</span>
          </div>

          <div className="flex items-baseline justify-between border-t border-[#c4e2f5] pt-4">
            <span className="font-label-md text-[#434653]">{t("subtotal")}</span>
            <span className="font-headline-md font-bold text-secondary">
              {formatPrice(subtotal, locale)}
            </span>
          </div>

          <p className="font-label-sm text-[#747684]">{t("estimateNote")}</p>

          {/* TODO: point at the quotation request form once it exists — it will
              persist the cart server side instead of handing off to /contact */}
          <Link
            href="/contact"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-linear-to-b from-[#078ee4] to-primary-container px-6 py-3 font-label-md font-semibold text-white shadow-blue-sm transition-all hover:brightness-110"
          >
            <MessageSquareQuote className="h-4 w-4" />
            {t("requestQuote")}
          </Link>
        </div>
      </aside>
    </div>
  );
}
