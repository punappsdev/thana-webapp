"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/use-cart";
import { MAX_QTY, clampQty } from "@/lib/cart";

/**
 * Product-level details a cart line needs, snapshotted at add time. Names come
 * in both languages so the cart follows the locale switcher.
 */
export interface CartProductInfo {
  productId: number;
  slug: string;
  nameTh: string;
  nameEn: string;
  image: string | null;
  pricingUnitNameTh: string | null;
  pricingUnitNameEn: string | null;
}

/**
 * What a cart line needs about the thing being added. `variantId` is null for a
 * product with no options at all, which is quoted at its base price.
 */
export interface QuoteLine {
  variantId: number | null;
  sku: string | null;
  unitPrice: number;
}

interface AddToQuoteProps {
  product: CartProductInfo;
  /** Null while the customer has not landed on something orderable */
  line: QuoteLine | null;
}

export function AddToQuote({ product, line }: AddToQuoteProps) {
  const t = useTranslations("Cart");
  const { add, openCart } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const disabled = line === null;

  const handleAdd = () => {
    if (!line) return;

    add({
      ...product,
      variantId: line.variantId,
      sku: line.sku,
      unitPrice: line.unitPrice,
      qty,
    });

    openCart();

    // Brief confirmation on the button itself — the sheet opening is the real
    // feedback, this just keeps the button from looking like nothing happened.
    setJustAdded(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center rounded-md border border-[#c4e2f5] bg-white">
        <button
          type="button"
          onClick={() => setQty((q) => clampQty(q - 1))}
          disabled={qty <= 1}
          aria-label={t("decrease")}
          className="p-2.5 text-primary transition-colors hover:bg-[#f3f3fc] disabled:opacity-30 disabled:hover:bg-transparent rounded-l-md cursor-pointer disabled:cursor-not-allowed"
        >
          <Minus className="h-4 w-4" />
        </button>

        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_QTY}
          value={qty}
          onChange={(e) => setQty(clampQty(Number(e.target.value)))}
          aria-label={t("quantity")}
          className="w-14 border-x border-[#c4e2f5] bg-transparent py-2 text-center font-label-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          onClick={() => setQty((q) => clampQty(q + 1))}
          disabled={qty >= MAX_QTY}
          aria-label={t("increase")}
          className="p-2.5 text-primary transition-colors hover:bg-[#f3f3fc] disabled:opacity-30 disabled:hover:bg-transparent rounded-r-md cursor-pointer disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        className="inline-flex flex-1 min-w-56 items-center justify-center gap-2 rounded-md bg-linear-to-b from-[#078ee4] to-primary-container px-6 py-3 font-label-md font-semibold text-white shadow-blue-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 cursor-pointer"
      >
        {justAdded ? (
          <>
            <Check className="h-4 w-4" />
            {t("added")}
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            {t("addToCart")}
          </>
        )}
      </button>
    </div>
  );
}
