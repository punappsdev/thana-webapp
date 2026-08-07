"use client";

import { useMemo, useState } from "react";
import { Check, PackageX } from "lucide-react";
import { MAX_TEXT_FIELD_LENGTH } from "@/lib/quotation-custom-fields";
import { AddToQuote, type CartProductInfo, type QuoteLine } from "./add-to-quote";

export interface VariantOption {
  id: number;
  sku: string | null;
  /** Whether this combination is offered at all — not a stock level */
  isAvailable: boolean;
  isDefault: boolean;
  /** AttributeValue ids that define this variant */
  valueIds: number[];
}

export interface AttributeGroup {
  id: number;
  name: string;
  nameTh: string;
  nameEn: string;
  unit: string | null;
  inputType: "SELECT" | "COLOR" | "NUMBER" | "TEXT";
  values: {
    id: number;
    label: string;
    valueTh: string;
    valueEn: string;
    colorHex: string | null;
  }[];
}

/**
 * Something the customer types in — the width of a cut-to-size sheet, or a note
 * such as the wording to be etched onto it.
 *
 * Shown only while `triggerValueId` is among the selected option values, so a
 * product offers both fixed sizes and a cut-to-size option from one group.
 * The limits are the same ones the server re-checks in the quotation action —
 * they are a real constraint here, not just an input hint.
 */
export interface CustomFieldOption {
  id: number;
  inputType: "NUMBER" | "TEXT";
  triggerValueId: number;
  /** Already resolved for the current locale */
  label: string;
  unit: string | null;
  labelTh: string;
  labelEn: string;
  unitTh: string | null;
  unitEn: string | null;
  /** NUMBER only */
  min: number | null;
  max: number | null;
  step: number | null;
  /** TEXT only */
  maxLength: number | null;
  required: boolean;
  /**
   * Translated sentences rather than a formatter callback: this is a client
   * component, and a function cannot cross the server boundary. The limits are
   * known when the page renders, so the server interpolates them there.
   *
   * `hintLabel` is the always-visible help text under the input; the other two
   * replace it when what has been typed cannot be accepted.
   */
  hintLabel: string;
  rangeLabel: string;
  stepLabel: string;
}

interface VariantSelectorProps {
  groups: AttributeGroup[];
  variants: VariantOption[];
  /**
   * Used when the product has no variants at all. Plenty of products are sold as
   * a single thing with nothing to pick, and those must stay quotable rather
   * than reading as unavailable.
   */
  baseSku: string | null;
  customFields?: CustomFieldOption[];
  labels: {
    selectOptions: string;
    selectAllPrompt: string;
    unavailable: string;
    sku: string;
    /** Heading above the inputs */
    customFieldsPrompt: string;
    /** Why the add button is disabled — sits next to the button, not the inputs */
    customFieldsIncomplete: string;
    /** Suffix on the label of a field the customer may leave blank */
    customFieldOptional: string;
  };
  /**
   * When present, an add-to-quotation-cart control is rendered below the option
   * groups. It lives here because this component owns `matchedVariant` — the only
   * place that knows which variant the customer settled on.
   */
  cartProduct?: CartProductInfo;
}

export function VariantSelector({
  groups,
  variants,
  baseSku,
  customFields = [],
  labels,
  cartProduct,
}: VariantSelectorProps) {
  /** No variants at all — nothing to pick, so the product is always quotable. */
  const isSimple = variants.length === 0;
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

  /**
   * Raw input strings, not numbers: the field has to stay empty while the
   * customer clears it and retypes, and "12." must survive mid-typing. They are
   * parsed on every render instead of on change.
   */
  const [customText, setCustomText] = useState<Record<number, string>>({});

  /** Only the fields whose trigger the customer is currently on are asked for. */
  const activeCustomFields = useMemo(
    () => customFields.filter((field) => selectedIds.includes(field.triggerValueId)),
    [customFields, selectedIds]
  );

  const customEntries = useMemo(
    () =>
      activeCustomFields.map((field) => {
        const raw = customText[field.id] ?? "";
        return { field, raw, ...evaluateCustomField(field, raw) };
      }),
    [activeCustomFields, customText]
  );

  const customComplete = customEntries.every((entry) => entry.error === null);

  /**
   * Only what the customer actually filled in. An optional field left blank is
   * absent rather than an empty string, so it never reaches the sales team as a
   * label with nothing after it.
   */
  const customValues = useMemo(
    () =>
      customComplete
        ? customEntries
            .filter((entry) => entry.value !== null)
            .map((entry) => ({ fieldId: entry.field.id, value: entry.value! }))
        : [],
    [customComplete, customEntries]
  );

  // A product with nothing to pick is always quotable; otherwise the line comes
  // from the variant the customer landed on, and only if it is actually offered.
  // A cut-to-size line is not quotable until its measurements are valid — the
  // sales team cannot price a sheet without a size, so a blank field blocks the
  // button the same way an unavailable combination does.
  const shownSku = isSimple ? baseSku : matchedVariant?.sku ?? null;
  const baseQuoteLine: QuoteLine | null = isSimple
    ? { variantId: null, sku: baseSku }
    : matchedVariant?.isAvailable
      ? { variantId: matchedVariant.id, sku: matchedVariant.sku }
      : null;
  const quoteLine = customComplete ? baseQuoteLine : null;

  /**
   * The bilingual snapshot the cart renders. Typed-in measurements are appended
   * as ordinary rows so the cart, the sheet and the quotation summary show them
   * without knowing anything about custom fields — the numbers read the same in
   * both languages, only the label and unit are translated.
   */
  const selectedAttributes = useMemo(() => {
    if (!isComplete || !customComplete) return [];
    const fromGroups = groups.map((group) => {
      const selectedValueId = selected[group.id];
      const val = group.values.find((v) => v.id === selectedValueId);
      return {
        nameTh: group.nameTh,
        nameEn: group.nameEn,
        valueTh: val?.valueTh ?? "",
        valueEn: val?.valueEn ?? "",
        colorHex: group.inputType === "COLOR" ? val?.colorHex : null,
      };
    });

    const fromCustom = customEntries
      .filter((entry) => entry.value !== null)
      .map(({ field, value }) => ({
        nameTh: field.labelTh,
        nameEn: field.labelEn,
        // A typed note reads the same in both languages; only the label and the
        // unit are translated, and free text usually has no unit at all.
        valueTh: withUnit(value!, field.unitTh),
        valueEn: withUnit(value!, field.unitEn),
        colorHex: null,
      }));

    return [...fromGroups, ...fromCustom];
  }, [isComplete, customComplete, customEntries, groups, selected]);

  return (
    <div className="space-y-6">
      {groups.length > 0 && (
        <div className="space-y-5">
          <h2 className="font-headline-sm font-semibold text-on-surface">
            {labels.selectOptions}
          </h2>

          {groups.map((group) => {
            const selectedVal = group.values.find((v) => v.id === selected[group.id]);

            return (
              <div key={group.id} className="space-y-2">
                <span className="font-label-md font-medium text-[#434653]">
                  {group.name}
                  {group.unit ? ` (${group.unit})` : ""}
                  {selectedVal && (
                    <span className="ml-1.5 font-semibold text-primary">
                      : {selectedVal.label}
                    </span>
                  )}
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
                          className={`inline-flex items-center gap-2 px-3 py-2 font-label-sm rounded-md font-semibold transition-all border ${
                            isActive
                              ? "bg-primary text-white border-primary shadow-blue-sm"
                              : "bg-white text-[#434653] border-[#c4e2f5] hover:bg-[#f3f3fc]"
                          } ${
                            !offered
                              ? "opacity-30 cursor-not-allowed line-through hover:bg-white"
                              : "cursor-pointer"
                          } ${dimmed ? "opacity-50 border-dashed" : ""}`}
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-black/10 shrink-0 shadow-xs relative flex items-center justify-center"
                            style={{ backgroundColor: value.colorHex }}
                          >
                            {isActive && (
                              <Check
                                className="h-2.5 w-2.5 drop-shadow-xs"
                                style={{ color: isLight(value.colorHex) ? "#1a1b22" : "#ffffff" }}
                              />
                            )}
                          </span>
                          <span>{value.label}</span>
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
            );
          })}
        </div>
      )}

      {/* What the customer has to fill in for the option just picked. Rendered
          right below the option groups because it is a continuation of the same
          choice, not a separate step — picking "cut to size" is only half of
          saying what you want. */}
      {customEntries.length > 0 && (
        <div className="space-y-3 rounded-md border border-[#c4e2f5] bg-[#f8fbfe] p-4">
          <p className="font-label-md font-medium text-[#434653]">
            {labels.customFieldsPrompt}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {customEntries.map(({ field, raw, error }) => {
              const isText = field.inputType === "TEXT";
              const hintId = `custom-field-${field.id}-hint`;
              // Only complain about what the customer has actually typed: an
              // untouched field is incomplete, not wrong.
              const showError = error !== null && raw.trim() !== "";
              const inputClass = `w-full rounded-md border bg-white px-3 py-2 font-body-md text-on-surface transition-colors focus:outline-none focus:ring-2 ${
                showError
                  ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/40"
                  : "border-[#c4e2f5] focus:ring-primary/40"
              }`;
              const onChange = (value: string) =>
                setCustomText((prev) => ({ ...prev, [field.id]: value }));

              return (
                // A free-text field gets the full row: notes are longer than
                // measurements and wrapping mid-phrase makes them hard to check.
                <div key={field.id} className={`space-y-1.5 ${isText ? "sm:col-span-2" : ""}`}>
                  <label
                    htmlFor={`custom-field-${field.id}`}
                    className="block font-label-sm font-medium text-[#434653]"
                  >
                    {field.label}
                    {field.unit ? ` (${field.unit})` : ""}
                    {!field.required && (
                      <span className="ml-1 font-normal text-[#747684]">
                        {labels.customFieldOptional}
                      </span>
                    )}
                  </label>

                  {isText ? (
                    <input
                      id={`custom-field-${field.id}`}
                      type="text"
                      // Stops the browser from offering the customer's own name,
                      // email or address for a field that asks for none of them.
                      autoComplete="off"
                      // The server collapses newlines anyway, and a hard cap here
                      // means the counter below can never disagree with it.
                      maxLength={field.maxLength ?? undefined}
                      value={raw}
                      onChange={(event) => onChange(event.target.value)}
                      aria-invalid={showError}
                      aria-describedby={hintId}
                      className={inputClass}
                    />
                  ) : (
                    <input
                      id={`custom-field-${field.id}`}
                      type="number"
                      inputMode="decimal"
                      min={field.min ?? undefined}
                      max={field.max ?? undefined}
                      step={field.step ?? undefined}
                      value={raw}
                      onChange={(event) => onChange(event.target.value)}
                      aria-invalid={showError}
                      aria-describedby={hintId}
                      className={`${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                    />
                  )}

                  {/* The limits stay on screen, not only after a mistake — they
                      are what the factory can actually cut or engrave. */}
                  <p
                    id={hintId}
                    className={`font-label-sm ${showError ? "text-[#ba1a1a]" : "text-[#747684]"}`}
                  >
                    {showError ? error : field.hintLabel}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status line reacting to the current selection — sits directly above the
          add-to-cart control so the reason a disabled button is disabled is right
          next to it. */}
      {!isComplete ? (
        <p className="font-body-sm text-[#434653]">{labels.selectAllPrompt}</p>
      ) : baseQuoteLine === null ? (
        <p className="inline-flex items-center gap-2 font-body-sm font-medium text-[#ba1a1a]">
          <PackageX className="h-4 w-4" />
          {labels.unavailable}
        </p>
      ) : !customComplete ? (
        <p className="font-body-sm text-[#434653]">{labels.customFieldsIncomplete}</p>
      ) : (
        // Only the variant's own code: a simple product already shows its SKU in
        // the page header, so repeating it here would just be noise.
        !isSimple &&
        shownSku && (
          <p className="font-label-sm text-[#747684]">
            {labels.sku}: {shownSku}
          </p>
        )
      )}

      {cartProduct && (
        <AddToQuote
          product={cartProduct}
          line={quoteLine}
          attributes={selectedAttributes}
          customValues={customValues}
        />
      )}
    </div>
  );
}

/**
 * Turns what is in the box into the value that would be submitted, plus the
 * reason it cannot be yet.
 *
 * Mirrors `resolveCustomValues` in lib/quotation-custom-fields.ts. That copy is
 * the one that protects the data; this one exists so the customer finds out
 * before submitting rather than losing the line silently.
 *
 * `value: null` with `error: null` is a blank optional field — nothing to send,
 * and nothing wrong with that.
 */
function evaluateCustomField(
  field: CustomFieldOption,
  raw: string
): { value: number | string | null; error: string | null } {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return { value: null, error: field.required ? field.hintLabel : null };
  }

  if (field.inputType === "TEXT") {
    // Collapsed the same way the server will, so the count the customer is
    // judged on is the one they can see.
    const text = trimmed.replace(/\s+/g, " ");
    const limit = field.maxLength ?? MAX_TEXT_FIELD_LENGTH;
    if (text.length > limit) return { value: null, error: field.rangeLabel };
    return { value: text, error: null };
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { value: null, error: field.rangeLabel };

  const min = field.min ?? Number.NEGATIVE_INFINITY;
  const max = field.max ?? Number.POSITIVE_INFINITY;
  if (value < min || value > max) return { value: null, error: field.rangeLabel };

  if (field.step && field.step > 0 && field.min !== null) {
    const steps = (value - field.min) / field.step;
    // Same tolerance as the server: the columns hold three decimal places, so a
    // value the admin can express must never fail on a rounding error.
    if (Math.abs(steps - Math.round(steps)) > 0.0005) {
      return { value: null, error: field.stepLabel };
    }
  }

  return { value, error: null };
}

/** "1200 มม." for a measurement, the note itself when there is no unit. */
function withUnit(value: number | string, unit: string | null): string {
  const trimmed = unit?.trim();
  return trimmed ? `${value} ${trimmed}` : String(value);
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
