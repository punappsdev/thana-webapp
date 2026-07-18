"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Package, Plus, Trash2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { formatPrice, pick } from "@/lib/products";
import { MAX_QTY, lineKey, type CartItem } from "@/lib/cart";
import { useCart } from "./use-cart";

interface CartLineRowProps {
  item: CartItem;
  /** "sheet" is the narrow side panel, "page" the wider table-like layout */
  layout: "sheet" | "page";
  /** Lets the sheet close itself when the customer follows a product link */
  onNavigate?: () => void;
}

export function CartLineRow({ item, layout, onNavigate }: CartLineRowProps) {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const { setQty, remove } = useCart();

  const key = lineKey(item);
  const thumbSize = layout === "page" ? "h-24 w-24" : "h-20 w-20";
  // Resolved per render, so switching locale relabels the cart in place
  const name = pick(item, "name", locale);
  const pricingUnitName = pick(item, "pricingUnitName", locale);

  return (
    <div className="flex gap-4 py-4">
      <Link
        href={`/products/${item.slug}`}
        onClick={onNavigate}
        className={`relative ${thumbSize} shrink-0 overflow-hidden rounded-lg border border-[#c4e2f5] bg-[#e2e2eb]`}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Package className="h-6 w-6 text-[#747684]" />
          </span>
        )}
      </Link>

      <div className={`flex min-w-0 flex-1 gap-4 ${layout === "page" ? "sm:items-start" : "flex-col"}`}>
        <div className="min-w-0 flex-1 space-y-1">
          <Link
            href={`/products/${item.slug}`}
            onClick={onNavigate}
            className="font-label-md font-semibold text-on-surface hover:text-primary transition-colors line-clamp-2"
          >
            {name}
          </Link>

          {item.sku && (
            <p className="font-label-sm text-[#747684]">{item.sku}</p>
          )}

          <p className="font-label-sm text-[#434653]">
            {formatPrice(item.unitPrice, locale)}
            {pricingUnitName ? ` / ${pricingUnitName}` : ""}
          </p>
        </div>

        <div
          className={`flex items-center gap-3 ${
            layout === "page" ? "sm:flex-col sm:items-end sm:gap-2" : "justify-between"
          }`}
        >
          <div className="inline-flex items-center rounded-md border border-[#c4e2f5] bg-white">
            <button
              type="button"
              onClick={() => setQty(key, item.qty - 1)}
              disabled={item.qty <= 1}
              aria-label={t("decrease")}
              className="p-2 text-primary transition-colors hover:bg-[#f3f3fc] disabled:opacity-30 disabled:hover:bg-transparent rounded-l-md cursor-pointer disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4" />
            </button>

            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_QTY}
              value={item.qty}
              onChange={(e) => setQty(key, Number(e.target.value))}
              aria-label={t("quantity")}
              className="w-12 border-x border-[#c4e2f5] bg-transparent py-1.5 text-center font-label-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />

            <button
              type="button"
              onClick={() => setQty(key, item.qty + 1)}
              disabled={item.qty >= MAX_QTY}
              aria-label={t("increase")}
              className="p-2 text-primary transition-colors hover:bg-[#f3f3fc] disabled:opacity-30 disabled:hover:bg-transparent rounded-r-md cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {layout === "page" && (
            <span className="font-label-lg font-semibold text-secondary">
              {formatPrice(item.unitPrice * item.qty, locale)}
            </span>
          )}

          <button
            type="button"
            onClick={() => remove(key)}
            aria-label={t("remove")}
            className="p-2 rounded-md text-[#747684] transition-colors hover:bg-[#ffdad6] hover:text-[#ba1a1a] cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
