"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/products";
import { lineKey } from "@/lib/cart";
import { useCart } from "./use-cart";
import { CartLineRow } from "./cart-line-row";
import { CartEmptyState } from "./cart-empty-state";

/**
 * Quick look at the quotation cart. Mounted once in the locale layout so any
 * page can pop it open through `useCart().openCart()`.
 */
export function CartSheet() {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const { items, count, subtotal, isOpen, closeCart, clear } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-[#c4e2f5] px-5 py-4">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("itemCount", { count })}</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <CartEmptyState onNavigate={closeCart} />
        ) : (
          <>
            <div className="flex-1 divide-y divide-[#e2e2eb] overflow-y-auto px-5">
              {items.map((item) => (
                <CartLineRow
                  key={lineKey(item)}
                  item={item}
                  layout="sheet"
                  onNavigate={closeCart}
                />
              ))}
            </div>

            <SheetFooter className="gap-3 border-t border-[#c4e2f5] px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="font-label-md text-[#434653]">{t("subtotal")}</span>
                <span className="font-headline-sm font-bold text-secondary">
                  {formatPrice(subtotal, locale)}
                </span>
              </div>

              <p className="font-label-sm text-[#747684]">{t("estimateNote")}</p>

              <Link
                href="/cart"
                onClick={closeCart}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-linear-to-b from-[#078ee4] to-primary-container px-6 py-3 font-label-md font-semibold text-white shadow-blue-sm transition-all hover:brightness-110"
              >
                {t("viewCart")}
              </Link>

              <button
                type="button"
                onClick={clear}
                className="w-full rounded-md py-2 font-label-sm font-medium text-[#747684] transition-colors hover:text-[#ba1a1a] cursor-pointer"
              >
                {t("clear")}
              </button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
