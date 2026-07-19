"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** An attribute from the shared dictionary, with every value ever defined for it. */
export type DictionaryAttribute = {
  id: number;
  nameTh: string;
  nameEn: string;
  unit: string | null;
  inputType: string;
  values: { id: number; valueTh: string; valueEn: string; colorHex: string | null }[];
};

/**
 * One attribute on a product. Either it points at a dictionary attribute
 * (`attributeId`) or it is a brand new one the admin typed in (`newNameTh`),
 * which the save action creates. Values work the same way: existing ids, plus
 * free-typed labels that become new AttributeValue rows.
 *
 * `isVariantAxis` is no longer a switch the admin toggles — it simply records
 * which of the two lists the attribute currently sits in.
 */
export type ProductAttributeDraft = {
  _key: string;
  attributeId: number | null;
  newNameTh: string;
  newNameEn: string;
  isVariantAxis: boolean;
  valueIds: number[];
  newValues: { _key: string; valueTh: string; valueEn: string }[];
};

export function newAttributeKey() {
  return crypto.randomUUID();
}

export function attributeLabel(draft: ProductAttributeDraft, dictionary: DictionaryAttribute[]): string {
  const source = draft.attributeId === null ? null : dictionary.find((item) => item.id === draft.attributeId);
  return source ? source.nameTh : draft.newNameTh;
}

/**
 * The list of attributes for one role — the options a customer picks, or the
 * spec-sheet-only facts. Which list an attribute is in *is* the decision, so
 * there is no extra switch to misread; moving it across is one explicit action.
 */
export function ProductAttributeList({
  attributes,
  dictionary,
  variantAxis,
  onChange,
  addLabel,
  emptyState,
}: {
  attributes: ProductAttributeDraft[];
  dictionary: DictionaryAttribute[];
  variantAxis: boolean;
  onChange: (next: ProductAttributeDraft[]) => void;
  addLabel: string;
  emptyState: React.ReactNode;
}) {
  const mine = attributes.filter((item) => item.isVariantAxis === variantAxis);
  const usedIds = new Set(attributes.map((item) => item.attributeId).filter((id): id is number => id !== null));

  const replaceMine = (nextMine: ProductAttributeDraft[]) =>
    onChange([...attributes.filter((item) => item.isVariantAxis !== variantAxis), ...nextMine]);

  const update = (key: string, patch: Partial<ProductAttributeDraft>) =>
    onChange(attributes.map((item) => (item._key === key ? { ...item, ...patch } : item)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= mine.length) return;
    const next = [...mine];
    [next[index], next[target]] = [next[target], next[index]];
    replaceMine(next);
  };

  const add = (draft: ProductAttributeDraft) => onChange([...attributes, draft]);

  return (
    <div className="space-y-3">
      {mine.map((attribute, index) => (
        <AttributeCard
          key={attribute._key}
          draft={attribute}
          dictionary={dictionary}
          variantAxis={variantAxis}
          isFirst={index === 0}
          isLast={index === mine.length - 1}
          onMove={(delta) => move(index, delta)}
          onUpdate={(patch) => update(attribute._key, patch)}
          onRemove={() => onChange(attributes.filter((item) => item._key !== attribute._key))}
        />
      ))}

      {mine.length === 0 ? emptyState : null}

      <AttributePicker
        dictionary={dictionary}
        usedIds={usedIds}
        label={addLabel}
        onPick={(attribute) =>
          add({ _key: newAttributeKey(), attributeId: attribute.id, newNameTh: "", newNameEn: "", isVariantAxis: variantAxis, valueIds: [], newValues: [] })
        }
        onCreate={(name) =>
          add({ _key: newAttributeKey(), attributeId: null, newNameTh: name, newNameEn: "", isVariantAxis: variantAxis, valueIds: [], newValues: [] })
        }
      />
    </div>
  );
}

function AttributeCard({
  draft,
  dictionary,
  variantAxis,
  isFirst,
  isLast,
  onMove,
  onUpdate,
  onRemove,
}: {
  draft: ProductAttributeDraft;
  dictionary: DictionaryAttribute[];
  variantAxis: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: number) => void;
  onUpdate: (patch: Partial<ProductAttributeDraft>) => void;
  onRemove: () => void;
}) {
  const source = draft.attributeId === null ? null : dictionary.find((item) => item.id === draft.attributeId) ?? null;
  const label = source ? source.nameTh : draft.newNameTh;
  const selected = source ? source.values.filter((value) => draft.valueIds.includes(value.id)) : [];
  const available = source ? source.values.filter((value) => !draft.valueIds.includes(value.id)) : [];
  const valueCount = selected.length + draft.newValues.length;

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-label-lg font-semibold">
            {label || "ยังไม่ได้ตั้งชื่อ"}
            {source?.unit ? <span className="ml-1 font-label-sm text-muted-foreground">({source.unit})</span> : null}
          </p>
          {!source ? <Badge variant="outline" className="font-label-sm">ใหม่</Badge> : null}
        </div>

        <div className="flex items-center gap-0.5">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="เลื่อนขึ้น" disabled={isFirst} onClick={() => onMove(-1)}>
            <ArrowUp className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="เลื่อนลง" disabled={isLast} onClick={() => onMove(1)}>
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onUpdate({ isVariantAxis: !variantAxis })}
            title={variantAxis ? "ย้ายไปเป็นข้อมูลจำเพาะ ลูกค้าจะเลือกไม่ได้" : "ย้ายมาเป็นตัวเลือก ลูกค้าจะเลือกได้และตั้งราคาแยกได้"}
          >
            <ArrowUpDown className="size-3.5" />
            {variantAxis ? "ย้ายไปข้อมูลจำเพาะ" : "ย้ายมาเป็นตัวเลือก"}
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="ลบ" onClick={onRemove}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {selected.map((value) => (
          <ValueChip key={value.id} label={value.valueTh} colorHex={value.colorHex} onRemove={() => onUpdate({ valueIds: draft.valueIds.filter((id) => id !== value.id) })} />
        ))}
        {draft.newValues.map((value) => (
          <ValueChip key={value._key} label={value.valueTh} isNew onRemove={() => onUpdate({ newValues: draft.newValues.filter((item) => item._key !== value._key) })} />
        ))}
        <ValuePicker
          available={available}
          onPick={(value) => onUpdate({ valueIds: [...draft.valueIds, value.id] })}
          onCreate={(name) => onUpdate({ newValues: [...draft.newValues, { _key: crypto.randomUUID(), valueTh: name, valueEn: "" }] })}
        />
      </div>

      {valueCount === 0 ? (
        <p className="mt-2 font-label-sm text-destructive">ต้องมีอย่างน้อย 1 ค่า จึงจะบันทึกได้</p>
      ) : null}
    </div>
  );
}

function ValueChip({ label, colorHex, isNew, onRemove }: { label: string; colorHex?: string | null; isNew?: boolean; onRemove: () => void }) {
  return (
    <Badge variant={isNew ? "outline" : "secondary"} className="gap-1.5 py-1 pr-1 font-label-sm">
      {colorHex ? <span className="size-3 rounded-full border" style={{ backgroundColor: colorHex }} /> : null}
      {label}
      {isNew ? <span className="text-muted-foreground">ใหม่</span> : null}
      <button type="button" aria-label={`ลบค่า ${label}`} onClick={onRemove} className="rounded-sm hover:bg-foreground/10">
        <X className="size-3" />
      </button>
    </Badge>
  );
}

function AttributePicker({
  dictionary,
  usedIds,
  label,
  onPick,
  onCreate,
}: {
  dictionary: DictionaryAttribute[];
  usedIds: Set<number>;
  label: string;
  onPick: (attribute: DictionaryAttribute) => void;
  onCreate: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectable = useMemo(() => dictionary.filter((item) => !usedIds.has(item.id)), [dictionary, usedIds]);
  const exactMatch = selectable.some((item) => item.nameTh.trim() === search.trim());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="size-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="ค้นหา หรือพิมพ์ชื่อใหม่แล้วกดสร้าง" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty className="py-3 font-body-sm">พิมพ์ชื่อเพื่อสร้างใหม่</CommandEmpty>
            {search.trim() && !exactMatch ? (
              <CommandGroup>
                <CommandItem
                  value={`__create__${search}`}
                  onSelect={() => {
                    onCreate(search.trim());
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Plus className="size-4" />
                  สร้าง &ldquo;{search.trim()}&rdquo;
                </CommandItem>
              </CommandGroup>
            ) : null}
            {selectable.length ? (
              <CommandGroup heading="ที่มีอยู่แล้วในระบบ">
                {selectable.map((attribute) => (
                  <CommandItem
                    key={attribute.id}
                    value={`${attribute.nameTh} ${attribute.nameEn}`}
                    onSelect={() => {
                      onPick(attribute);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <span>{attribute.nameTh}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ValuePicker({
  available,
  onPick,
  onCreate,
}: {
  available: { id: number; valueTh: string; valueEn: string; colorHex: string | null }[];
  onPick: (value: { id: number; valueTh: string }) => void;
  onCreate: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const exactMatch = available.some((item) => item.valueTh.trim() === search.trim());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="size-3.5" />
          เพิ่มค่า
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="ค้นหา หรือพิมพ์ค่าใหม่" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty className="py-3 font-body-sm">พิมพ์เพื่อสร้างค่าใหม่</CommandEmpty>
            {search.trim() && !exactMatch ? (
              <CommandGroup>
                <CommandItem
                  value={`__create__${search}`}
                  onSelect={() => {
                    onCreate(search.trim());
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Plus className="size-4" />
                  สร้าง &ldquo;{search.trim()}&rdquo;
                </CommandItem>
              </CommandGroup>
            ) : null}
            {available.length ? (
              <CommandGroup heading="ค่าที่มีอยู่แล้ว">
                {available.map((value) => (
                  <CommandItem
                    key={value.id}
                    value={`${value.valueTh} ${value.valueEn}`}
                    onSelect={() => {
                      onPick(value);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    {value.colorHex ? <span className="size-3 rounded-full border" style={{ backgroundColor: value.colorHex }} /> : null}
                    {value.valueTh}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
