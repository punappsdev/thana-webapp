"use client";

import { useMemo, useState } from "react";
import { Check, PackageX } from "lucide-react";
import { formatPrice } from "@/lib/products";
import { AddToQuote, type CartProductInfo } from "./add-to-quote";

export interface VariantOption {
  id: number;
  sku: string | null;
  price: number;
  comparePrice: number | null;
  /** Whether this combination is offered at all — not a stock level */
  isAvailable: boolean;
  isDefault: boolean;
  /** AttributeValue ids that define this variant */
  valueIds: number[];
}

export interface AttributeGroup {
  id: number;
  name: string;
  unit: string | null;
  inputType: "SELECT" | "COLOR" | "NUMBER" | "TEXT";
  values: { id: number; label: string; colorHex: string | null }[];
}

interface VariantSelectorProps {
  groups: AttributeGroup[];
  variants: VariantOption[];
  locale: string;
  pricingUnitName: string | null;
  labels: {
    selectOptions: string;
    selectAllPrompt: string;
    unavailable: string;
    sku: string;
  };
  /**
   * When present, an add-to-quotation-cart control is rendered below the price
   * panel. It lives here because this component owns `matchedVariant` — the only
   * place that knows which variant the customer settled on.
   */
  cartProduct?: CartProductInfo;
}

export function VariantSelector({
  groups,
  variants,
  locale,
  pricingUnitName,
  labels,
  cartProduct,
}: VariantSelectorProps) {
  // Seed the selection from the variant flagged as default, else the first one
  const initial = useMemo(() => {
    const seed = variants.find((v) => v.isDefault) ?? variants[0];
    const selection: Record<number, number> = {};
    if (!seed) return selection;
    for (const group of groups) {
      const match = group.values.find((val) => seed.valueIds.includes(val.id));
      if (match) selection[group.id] = match.id;
    }
    return selection;
  }, [groups, variants]);

  const [selected, setSelected] = useState<Record<number, number>>(initial);

  const selectedIds = useMemo(
    () => Object.values(selected).filter((v): v is number => v !== undefined),
    [selected]
  );

  const isComplete = groups.every((g) => selected[g.id] !== undefined);

  // A variant matches when it carries every selected value and nothing extra
  const matchedVariant = useMemo(() => {
    if (!isComplete) return null;
    return (
      variants.find(
        (v) =>
          v.valueIds.length === selectedIds.length &&
          selectedIds.every((id) => v.valueIds.includes(id))
      ) ?? null
    );
  }, [isComplete, selectedIds, variants]);

  /** Values carried by at least one sellable variant. Anything else is truly not offered. */
  const offeredIds = useMemo(
    () => new Set(variants.filter((v) => v.isAvailable).flatMap((v) => v.valueIds)),
    [variants]
  );

  /**
   * Whether a value fits alongside what is currently picked in the *other* groups.
   * This only dims the option — it must never block the click, or two options that
   * each require the other end up locking each other out and their variant becomes
   * unreachable (e.g. silver needs brushed while brushed needs silver).
   */
  const isCompatible = (groupId: number, valueId: number) => {
    const others = Object.entries(selected)
      .filter(([gid]) => Number(gid) !== groupId)
      .map(([, vid]) => vid);
    return variants.some(
      (v) => v.isAvailable && v.valueIds.includes(valueId) && others.every((id) => v.valueIds.includes(id))
    );
  };

  /**
   * Picking a value always wins. When it clashes with the other groups, snap those
   * groups onto a real variant carrying the clicked value, keeping as much of the
   * previous selection as possible, so every variant stays reachable in one click.
   */
  const pick = (groupId: number, valueId: number) =>
    setSelected((prev) => {
      const next = { ...prev, [groupId]: valueId };
      const ids = Object.values(next);
      const exact = variants.find(
        (v) => v.valueIds.length === ids.length && ids.every((id) => v.valueIds.includes(id))
      );
      if (exact) return next;

      const candidates = variants.filter((v) => v.isAvailable && v.valueIds.includes(valueId));
      if (candidates.length === 0) return next;

      const kept = (v: VariantOption) =>
        Object.entries(prev).filter(
          ([gid, vid]) => Number(gid) !== groupId && v.valueIds.includes(vid)
        ).length;
      const best = candidates.reduce((a, b) => (kept(b) > kept(a) ? b : a));

      const resolved: Record<number, number> = {};
      for (const group of groups) {
        const match = group.values.find((val) => best.valueIds.includes(val.id));
        if (match) resolved[group.id] = match.id;
      }
      return resolved;
    });

  return (
    <div className="space-y-6">
      {groups.length > 0 && (
        <div className="space-y-5">
          <h3 className="font-headline-sm font-semibold text-on-surface">
            {labels.selectOptions}
          </h3>

          {groups.map((group) => (
            <div key={group.id} className="space-y-2">
              <span className="font-label-md font-medium text-[#434653]">
                {group.name}
                {group.unit ? ` (${group.unit})` : ""}
              </span>

              <div className="flex flex-wrap gap-2">
                {group.values.map((value) => {
                  const isActive = selected[group.id] === value.id;
                  const offered = offeredIds.has(value.id);
                  // Dimmed means "does not go with your current pick", not "cannot click"
                  const dimmed = offered && !isActive && !isCompatible(group.id, value.id);

                  if (group.inputType === "COLOR" && value.colorHex) {
                    return (
                      <button
                        key={value.id}
                        type="button"
                        onClick={() => pick(group.id, value.id)}
                        title={value.label}
                        aria-label={value.label}
                        aria-pressed={isActive}
                        disabled={!offered}
                        className={`relative h-10 w-10 rounded-md border-2 transition-all ${
                          isActive
                            ? "border-primary shadow-blue-sm scale-105"
                            : "border-[#c4c6d5] hover:border-primary/50"
                        } ${!offered ? "opacity-30 cursor-not-allowed" : "cursor-pointer"} ${
                          dimmed ? "opacity-50" : ""
                        }`}
                        style={{ backgroundColor: value.colorHex }}
                      >
                        {isActive && (
                          <Check
                            className="absolute inset-0 m-auto h-4 w-4 drop-shadow"
                            style={{ color: isLight(value.colorHex) ? "#1a1b22" : "#ffffff" }}
                          />
                        )}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={value.id}
                      type="button"
                      onClick={() => pick(group.id, value.id)}
                      aria-pressed={isActive}
                      disabled={!offered}
                      className={`px-4 py-2 font-label-sm rounded-md font-semibold transition-all border ${
                        isActive
                          ? "bg-primary text-white border-primary shadow-blue-sm"
                          : "bg-white text-[#434653] border-[#c4e2f5] hover:bg-[#f3f3fc]"
                      } ${
                        !offered
                          ? "opacity-40 cursor-not-allowed line-through hover:bg-white"
                          : "cursor-pointer"
                      } ${dimmed ? "opacity-50 border-dashed" : ""}`}
                    >
                      {value.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price panel reacting to the current selection */}
      <div className="rounded-lg border border-[#c4e2f5] bg-[#f3f3fc] p-5">
        {!isComplete ? (
          <p className="font-body-sm text-[#434653]">{labels.selectAllPrompt}</p>
        ) : matchedVariant ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-display-md text-secondary font-bold">
                {formatPrice(matchedVariant.price, locale)}
              </span>
              {matchedVariant.comparePrice !== null &&
                matchedVariant.comparePrice > matchedVariant.price && (
                  <span className="font-body-md text-[#747684] line-through">
                    {formatPrice(matchedVariant.comparePrice, locale)}
                  </span>
                )}
              {pricingUnitName && (
                <span className="font-label-md text-[#434653]">{pricingUnitName}</span>
              )}
            </div>

            {matchedVariant.sku && (
              <span className="font-label-sm text-[#747684]">
                {labels.sku}: {matchedVariant.sku}
              </span>
            )}
          </div>
        ) : (
          <p className="inline-flex items-center gap-2 font-body-sm font-medium text-[#ba1a1a]">
            <PackageX className="h-4 w-4" />
            {labels.unavailable}
          </p>
        )}
      </div>

      {cartProduct && <AddToQuote product={cartProduct} variant={matchedVariant} />}
    </div>
  );
}

/** Rough luminance check so the check mark stays readable on pale swatches. */
function isLight(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
