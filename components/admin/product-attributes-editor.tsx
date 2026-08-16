"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ActionResult } from "@/lib/admin/validation";

/** An attribute from the shared dictionary, with every value ever defined for it. */
export type DictionaryAttribute = {
  id: number;
  nameTh: string;
  nameEn: string;
  unit: string | null;
  inputType: string;
  values: { id: number; valueTh: string; valueEn: string; colorHex: string | null }[];
};

export type DictionaryRenameInput = {
  kind: "attribute" | "value";
  id: number;
  nameTh: string;
  nameEn: string;
};

export type RenameDictionaryEntry = (input: DictionaryRenameInput) => Promise<ActionResult>;

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
  onRename,
  addLabel,
  emptyState,
}: {
  attributes: ProductAttributeDraft[];
  dictionary: DictionaryAttribute[];
  variantAxis: boolean;
  onChange: (next: ProductAttributeDraft[]) => void;
  onRename: RenameDictionaryEntry;
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
          onRename={onRename}
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
        onCreate={(nameTh, nameEn) =>
          add({ _key: newAttributeKey(), attributeId: null, newNameTh: nameTh, newNameEn: nameEn, isVariantAxis: variantAxis, valueIds: [], newValues: [] })
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
  onRename,
}: {
  draft: ProductAttributeDraft;
  dictionary: DictionaryAttribute[];
  variantAxis: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: number) => void;
  onUpdate: (patch: Partial<ProductAttributeDraft>) => void;
  onRemove: () => void;
  onRename: RenameDictionaryEntry;
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
          {source ? (
            <DictionaryRenamePopover
              kind="attribute"
              id={source.id}
              nameTh={source.nameTh}
              nameEn={source.nameEn}
              onRename={onRename}
            />
          ) : null}
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
            title={variantAxis ? "ย้ายไปเป็นข้อมูลจำเพาะ ลูกค้าจะเลือกไม่ได้" : "ย้ายมาเป็นตัวเลือก ลูกค้าจะเลือกได้ก่อนขอใบเสนอราคา"}
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
          <ValueChip
            key={value.id}
            label={value.valueTh}
            colorHex={value.colorHex}
            rename={{ id: value.id, nameTh: value.valueTh, nameEn: value.valueEn }}
            onRename={onRename}
            onRemove={() => onUpdate({ valueIds: draft.valueIds.filter((id) => id !== value.id) })}
          />
        ))}
        {draft.newValues.map((value) => (
          <ValueChip key={value._key} label={value.valueTh} isNew onRemove={() => onUpdate({ newValues: draft.newValues.filter((item) => item._key !== value._key) })} />
        ))}
        <ValuePicker
          available={available}
          onPick={(value) => onUpdate({ valueIds: [...draft.valueIds, value.id] })}
          onCreate={(valueTh, valueEn) => onUpdate({ newValues: [...draft.newValues, { _key: crypto.randomUUID(), valueTh, valueEn }] })}
        />
      </div>

      {valueCount === 0 ? (
        <p className="mt-2 font-label-sm text-destructive">ต้องมีอย่างน้อย 1 ค่า จึงจะบันทึกได้</p>
      ) : null}
    </div>
  );
}

function ValueChip({ label, colorHex, isNew, rename, onRename, onRemove }: {
  label: string;
  colorHex?: string | null;
  isNew?: boolean;
  rename?: Omit<DictionaryRenameInput, "kind">;
  onRename?: RenameDictionaryEntry;
  onRemove: () => void;
}) {
  return (
    <Badge variant={isNew ? "outline" : "secondary"} className="gap-1.5 py-1 pr-1 font-label-sm">
      {colorHex ? <span className="size-3 rounded-full border" style={{ backgroundColor: colorHex }} /> : null}
      {label}
      {isNew ? <span className="text-muted-foreground">ใหม่</span> : null}
      {rename && onRename ? <DictionaryRenamePopover kind="value" {...rename} onRename={onRename} /> : null}
      <button
        type="button"
        aria-label={`ลบค่า ${label}`}
        onClick={onRemove}
        className="inline-flex size-4 items-center justify-center rounded-full text-current/70 transition-colors hover:bg-current/15 hover:text-current focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <X className="size-2.5" />
      </button>
    </Badge>
  );
}

function DictionaryRenamePopover({ kind, id, nameTh, nameEn, onRename }: DictionaryRenameInput & { onRename: RenameDictionaryEntry }) {
  const [open, setOpen] = useState(false);
  const [editingNameTh, setEditingNameTh] = useState(nameTh);
  const [editingNameEn, setEditingNameEn] = useState(nameEn);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isAttribute = kind === "attribute";
  const ready = editingNameTh.trim().length > 0 && editingNameEn.trim().length > 0;

  const resetForOpen = () => {
    setEditingNameTh(nameTh);
    setEditingNameEn(nameEn);
    setError(null);
  };

  const submit = async () => {
    if (!ready || pending) return;

    setError(null);
    setPending(true);
    try {
      const result = await onRename({ kind, id, nameTh: editingNameTh.trim(), nameEn: editingNameEn.trim() });
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.message || "บันทึกชื่อไม่สำเร็จ");
      }
    } catch {
      setError("บันทึกชื่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setPending(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) resetForOpen();
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        {isAttribute ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`แก้ไขชื่อคุณลักษณะ ${nameTh}`}
            title="แก้ไขชื่อคุณลักษณะส่วนกลาง"
            disabled={pending}
            className="size-6 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <button
            type="button"
            aria-label={`แก้ไขค่าคุณลักษณะ ${nameTh}`}
            title="แก้ไขค่าคุณลักษณะส่วนกลาง"
            disabled={pending}
            className="inline-flex size-4 items-center justify-center rounded-full text-current/70 transition-colors hover:bg-current/15 hover:text-current focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <Pencil className="size-2.5" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 max-w-[calc(100vw-2rem)] p-0"
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <div
          role="form"
          aria-label={isAttribute ? "แก้ไขชื่อคุณลักษณะ" : "แก้ไขค่าคุณลักษณะ"}
          className="space-y-3 p-3"
          onChange={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
        >
          <div>
            <p className="font-label-md font-semibold">{isAttribute ? "แก้ไขชื่อคุณลักษณะ" : "แก้ไขค่าคุณลักษณะ"}</p>
            <p className="mt-1 font-label-sm text-muted-foreground">บันทึกทันที และมีผลกับสินค้าทุกชิ้นที่ใช้{isAttribute ? "คุณลักษณะนี้" : "ค่านี้"}</p>
          </div>
          <div className="space-y-2">
            <Label className="font-label-sm">ชื่อภาษาไทย</Label>
            <Input
              autoFocus
              value={editingNameTh}
              onChange={(event) => setEditingNameTh(event.target.value)}
              className="font-body-sm"
              disabled={pending}
              aria-invalid={Boolean(error) || undefined}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-label-sm">ชื่อภาษาอังกฤษ</Label>
            <Input
              value={editingNameEn}
              onChange={(event) => setEditingNameEn(event.target.value)}
              className="font-body-sm"
              disabled={pending}
              aria-invalid={Boolean(error) || undefined}
            />
          </div>
          <p className="font-label-sm text-muted-foreground">ต้องกรอกทั้งสองภาษา</p>
          {error ? <p role="alert" className="font-label-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              ยกเลิก
            </Button>
            <Button type="button" size="sm" disabled={!ready || pending} onClick={() => void submit()} aria-busy={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {pending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Both languages are collected up front when something new is created. The old
 * flow stored the Thai text in the English column too, so the /en storefront
 * silently rendered Thai labels with nothing to signal the missing translation.
 */
function BilingualCreateForm({
  title,
  thLabel,
  enLabel,
  initialTh,
  onCancel,
  onSubmit,
}: {
  title: string;
  thLabel: string;
  enLabel: string;
  initialTh: string;
  onCancel: () => void;
  onSubmit: (th: string, en: string) => void;
}) {
  const [th, setTh] = useState(initialTh);
  const [en, setEn] = useState("");
  const ready = th.trim().length > 0 && en.trim().length > 0;

  const submit = () => {
    if (ready) onSubmit(th.trim(), en.trim());
  };

  return (
    <div className="space-y-3 p-3">
      <p className="font-label-md font-semibold">{title}</p>
      <div className="space-y-2">
        <Label className="font-label-sm">{thLabel}</Label>
        <Input value={th} onChange={(event) => setTh(event.target.value)} className="font-body-sm" />
      </div>
      <div className="space-y-2">
        <Label className="font-label-sm">{enLabel}</Label>
        <Input
          autoFocus
          value={en}
          onChange={(event) => setEn(event.target.value)}
          placeholder="เช่น Width"
          className="font-body-sm"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
      </div>
      <p className="font-label-sm text-muted-foreground">ต้องกรอกทั้งสองภาษา เพราะหน้าเว็บมีทั้งไทยและอังกฤษ</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="button" size="sm" disabled={!ready} onClick={submit}>
          เพิ่ม
        </Button>
      </div>
    </div>
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
  onCreate: (nameTh: string, nameEn: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState<string | null>(null);
  const selectable = useMemo(() => dictionary.filter((item) => !usedIds.has(item.id)), [dictionary, usedIds]);
  const exactMatch = selectable.some((item) => item.nameTh.trim() === search.trim());

  const close = () => {
    setSearch("");
    setCreating(null);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearch("");
          setCreating(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="size-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {creating !== null ? (
          <BilingualCreateForm
            title="สร้างรายการใหม่"
            thLabel="ชื่อภาษาไทย"
            enLabel="ชื่อภาษาอังกฤษ"
            initialTh={creating}
            onCancel={() => setCreating(null)}
            onSubmit={(th, en) => {
              onCreate(th, en);
              close();
            }}
          />
        ) : (
        <Command>
          <CommandInput placeholder="ค้นหา หรือพิมพ์ชื่อใหม่แล้วกดสร้าง" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty className="py-3 font-body-sm">พิมพ์ชื่อเพื่อสร้างใหม่</CommandEmpty>
            {search.trim() && !exactMatch ? (
              <CommandGroup>
                <CommandItem value={`__create__${search}`} onSelect={() => setCreating(search.trim())}>
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
        )}
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
  onCreate: (valueTh: string, valueEn: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState<string | null>(null);
  const exactMatch = available.some((item) => item.valueTh.trim() === search.trim());

  const close = () => {
    setSearch("");
    setCreating(null);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearch("");
          setCreating(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="size-3.5" />
          เพิ่มค่า
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {creating !== null ? (
          <BilingualCreateForm
            title="สร้างค่าใหม่"
            thLabel="ค่าภาษาไทย"
            enLabel="ค่าภาษาอังกฤษ"
            initialTh={creating}
            onCancel={() => setCreating(null)}
            onSubmit={(th, en) => {
              onCreate(th, en);
              close();
            }}
          />
        ) : (
        <Command>
          <CommandInput placeholder="ค้นหา หรือพิมพ์ค่าใหม่" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty className="py-3 font-body-sm">พิมพ์เพื่อสร้างค่าใหม่</CommandEmpty>
            {search.trim() && !exactMatch ? (
              <CommandGroup>
                <CommandItem value={`__create__${search}`} onSelect={() => setCreating(search.trim())}>
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
        )}
      </PopoverContent>
    </Popover>
  );
}
