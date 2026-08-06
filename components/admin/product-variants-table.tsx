"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MAX_COMBINATIONS } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";
import type { DictionaryAttribute, ProductAttributeDraft } from "@/components/admin/product-attributes-editor";

/**
 * A variant references attribute values that may not exist in the database yet
 * (the admin can type a brand new value straight into an option). So variants
 * address values by a stable client token instead of a raw id, and the save
 * action resolves tokens to ids once the new rows are created.
 *   existing value -> "v:<attributeValueId>"
 *   new value      -> "n:<clientKey>"
 */
export type ValueToken = string;

export type VariantRow = {
  _key: string;
  sku: string;
  /** Not shown or editable — kept so saving cannot wipe the stored value. */
  price: number | "";
  image: string;
  isAvailable: boolean;
  isDefault: boolean;
  sortOrder: number;
  valueTokens: ValueToken[];
};

export type VariantAxis = {
  attributeKey: string;
  label: string;
  options: { token: ValueToken; label: string }[];
};

export { MAX_COMBINATIONS };

/**
 * True once the options would generate more rows than the cap. Both the table
 * and the form's save buttons read this, so the warning and the disabled button
 * can never disagree about where the line is.
 */
export function isOverCombinationLimit(axes: VariantAxis[]): boolean {
  return axes.length > 0 && axes.reduce((total, axis) => total * axis.options.length, 1) > MAX_COMBINATIONS;
}

export function existingToken(attributeValueId: number): ValueToken {
  return `v:${attributeValueId}`;
}

/** Derives the axes (and their option tokens) from the customer-facing options. */
export function buildAxes(attributes: ProductAttributeDraft[], dictionary: DictionaryAttribute[]): VariantAxis[] {
  return attributes
    .filter((attribute) => attribute.isVariantAxis)
    .map((attribute) => {
      const source = attribute.attributeId === null ? null : dictionary.find((item) => item.id === attribute.attributeId);
      const existing = (source?.values ?? [])
        .filter((value) => attribute.valueIds.includes(value.id))
        .map((value) => ({ token: existingToken(value.id), label: value.valueTh }));
      const created = attribute.newValues.map((value) => ({ token: `n:${value._key}`, label: value.valueTh }));
      return {
        attributeKey: attribute._key,
        label: source ? source.nameTh : attribute.newNameTh || "ตัวเลือกใหม่",
        options: [...existing, ...created],
      };
    })
    .filter((axis) => axis.options.length > 0);
}

export function combinationKey(tokens: ValueToken[]): string {
  return [...tokens].sort().join("|");
}

function cartesian(axes: VariantAxis[]): ValueToken[][] {
  return axes.reduce<ValueToken[][]>(
    (rows, axis) => rows.flatMap((row) => axis.options.map((option) => [...row, option.token])),
    [[]],
  );
}

/**
 * Rebuilds the variant rows from the current options, carrying over anything the
 * admin already typed for a combination that still exists. This runs on every
 * option change instead of behind a button — the rows are a pure function of the
 * options, and a stale table waiting for someone to remember to press "generate"
 * was the main thing that made the old editor confusing.
 */
export function syncVariants(current: VariantRow[], axes: VariantAxis[]): VariantRow[] {
  if (!axes.length) return [];

  const combinations = cartesian(axes);
  if (combinations.length > MAX_COMBINATIONS) return current;

  const existing = new Map(current.map((row) => [combinationKey(row.valueTokens), row]));
  const rows = combinations.map((tokens, index) => {
    const exact = existing.get(combinationKey(tokens));
    if (exact) return { ...exact, valueTokens: tokens, sortOrder: index };

    // Adding or removing an option changes every combination key, which would
    // blank out what the admin already filled in. Inherit from whichever old row
    // shares the most values — adding "colour" to a product with thickness rows
    // then carries each thickness row's image (and its stored, no-longer-editable
    // price) onto its colour rows. SKU is left empty because it has to stay unique.
    const closest = current.reduce<{ row: VariantRow; overlap: number } | null>((best, row) => {
      const overlap = row.valueTokens.filter((token) => tokens.includes(token)).length;
      return overlap > 0 && (!best || overlap > best.overlap) ? { row, overlap } : best;
    }, null);

    return {
      _key: crypto.randomUUID(),
      sku: "",
      price: closest ? closest.row.price : ("" as const),
      image: closest ? closest.row.image : "",
      isAvailable: true,
      isDefault: false,
      sortOrder: index,
      valueTokens: tokens,
    };
  });

  // Exactly one default has to survive or the save is rejected.
  return rows.some((row) => row.isDefault) ? rows : rows.map((row, index) => ({ ...row, isDefault: index === 0 }));
}

export function ProductVariantsTable({
  variants,
  axes,
  onChange,
}: {
  variants: VariantRow[];
  axes: VariantAxis[];
  onChange: (next: VariantRow[]) => void;
}) {
  const labelOf = (token: ValueToken) => {
    for (const axis of axes) {
      const option = axis.options.find((item) => item.token === token);
      if (option) return option.label;
    }
    return "—";
  };

  const update = (key: string, patch: Partial<VariantRow>) =>
    onChange(variants.map((row) => (row._key === key ? { ...row, ...patch } : row)));

  const setDefault = (key: string) => onChange(variants.map((row) => ({ ...row, isDefault: row._key === key })));

  const overLimit = isOverCombinationLimit(axes);

  const duplicateSkus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of variants) {
      const sku = v.sku?.trim().toLowerCase();
      if (sku) counts.set(sku, (counts.get(sku) || 0) + 1);
    }
    const dupes = new Set<string>();
    for (const [sku, count] of counts.entries()) {
      if (count > 1) dupes.add(sku);
    }
    return dupes;
  }, [variants]);

  if (!axes.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-label-lg font-semibold">ตัวเลือกสินค้าแต่ละแบบ</h3>
        <p className="font-label-sm text-muted-foreground">
          {axes.map((axis) => axis.label).join(" × ")} — {variants.length} รายการ
        </p>
      </div>
      <p className="font-body-sm text-muted-foreground">
        ตารางนี้สร้างให้อัตโนมัติจากตัวเลือกด้านบน · <span className="font-semibold text-foreground">SKU</span> ไม่บังคับ · <span className="font-semibold text-foreground">ขายอยู่</span> ติ๊กออกเมื่อเลิกขายชั่วคราว · <span className="font-semibold text-foreground">ค่าเริ่มต้น</span> คือแบบที่แสดงก่อน เลือกได้เพียงแบบเดียว
      </p>

      {overLimit ? (
        <p className="rounded-md border border-destructive bg-error-container p-3 font-body-sm text-on-error-container">
          ตัวเลือกชุดนี้ทำให้เกิดมากกว่า {MAX_COMBINATIONS} รายการ กรุณาลดจำนวนค่าลงก่อน ตารางจึงจะอัปเดตและบันทึกได้
        </p>
      ) : null}

      {duplicateSkus.size > 0 ? (
        <p className="rounded-md border border-destructive bg-error-container p-2.5 font-body-sm text-on-error-container font-medium">
          พบ SKU ซ้ำกันในตารางตัวเลือกสินค้า กรุณาแก้ไขรหัสที่ซ้ำกัน
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {axes.map((axis) => (
                <TableHead key={axis.attributeKey} className="font-label-md">{axis.label}</TableHead>
              ))}
              <TableHead className="font-label-md">SKU</TableHead>
              <TableHead className="text-center font-label-md">ขายอยู่</TableHead>
              <TableHead className="text-center font-label-md">ค่าเริ่มต้น</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((row) => {
              const isDuplicateSku = Boolean(row.sku?.trim()) && duplicateSkus.has(row.sku.trim().toLowerCase());
              return (
                <TableRow key={row._key}>
                  {axes.map((axis) => {
                    const token = row.valueTokens.find((item) => axis.options.some((option) => option.token === item));
                    return (
                      <TableCell key={axis.attributeKey} className="font-label-md whitespace-nowrap">
                        {token ? labelOf(token) : <span className="text-destructive">ไม่ระบุ</span>}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <Input
                      value={row.sku}
                      onChange={(event) => update(row._key, { sku: event.target.value })}
                      placeholder="ไม่บังคับ"
                      aria-invalid={isDuplicateSku || undefined}
                      className={cn("w-32 font-body-sm", isDuplicateSku && "border-destructive focus-visible:ring-destructive")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <input type="checkbox" aria-label="ขายอยู่" checked={row.isAvailable} onChange={(event) => update(row._key, { isAvailable: event.target.checked })} />
                  </TableCell>
                  <TableCell className="text-center">
                    <input type="radio" name="variant-default" aria-label="ค่าเริ่มต้น" checked={row.isDefault} onChange={() => setDefault(row._key)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
