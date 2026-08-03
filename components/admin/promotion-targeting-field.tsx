"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronRight, Loader2, Package, Plus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { TargetCategoryOption, TargetProduct } from "@/lib/admin/content-data";
import { cn } from "@/lib/utils";

type Option = { id: number; label: string; searchText: string };

export type PromotionTargeting = {
  showOnAllProducts: boolean;
  targetProducts: TargetProduct[];
  targetCategoryIds: number[];
  targetSubCategoryIds: number[];
};

/**
 * "Bind this promotion to the catalog" editor.
 *
 * The four rules are ORed together on the storefront, so the switch and the
 * three lists are independent rather than a single mode picker: an admin can
 * cover a whole category and still pin one product from outside it.
 *
 * Turning on "every product" only dims the lists — they stay mounted and keep
 * submitting, so flipping the switch back does not silently discard a selection
 * that took a while to assemble.
 */
export function PromotionTargetingField({
  categories,
  initial,
  onDirty,
}: {
  categories: TargetCategoryOption[];
  initial: PromotionTargeting;
  onDirty: () => void;
}) {
  const [showAll, setShowAll] = useState(initial.showOnAllProducts);
  const [products, setProducts] = useState<TargetProduct[]>(initial.targetProducts);
  const [categoryIds, setCategoryIds] = useState<number[]>(initial.targetCategoryIds);
  const [subCategoryIds, setSubCategoryIds] = useState<number[]>(initial.targetSubCategoryIds);

  const categoryOptions = useMemo<Option[]>(
    () => categories.map((category) => ({ id: category.id, label: category.nameTh, searchText: `${category.nameTh} ${category.nameEn}` })),
    [categories],
  );

  // Sub-category names repeat across categories ("ใส", "สีชา"), so the chip and
  // the picker row both carry the parent name or the admin cannot tell them apart.
  const subCategoryOptions = useMemo<Option[]>(
    () =>
      categories.flatMap((category) =>
        category.subCategories.map((sub) => ({
          id: sub.id,
          label: `${category.nameTh} › ${sub.nameTh}`,
          searchText: `${category.nameTh} ${category.nameEn} ${sub.nameTh} ${sub.nameEn}`,
        })),
      ),
    [categories],
  );

  const change = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); onDirty(); };
  const setShowAllDirty = change(setShowAll);
  const setCategoryIdsDirty = change<number[]>(setCategoryIds);
  const setSubCategoryIdsDirty = change<number[]>(setSubCategoryIds);
  const setProductsDirty = change<TargetProduct[]>(setProducts);

  const boundCount = products.length + categoryIds.length + subCategoryIds.length;

  return (
    <div className="space-y-5">
      <input type="hidden" name="showOnAllProducts" value={showAll ? "1" : ""} readOnly />
      <input type="hidden" name="targetProductIdsJson" value={JSON.stringify(products.map((product) => product.id))} readOnly />
      <input type="hidden" name="targetCategoryIdsJson" value={JSON.stringify(categoryIds)} readOnly />
      <input type="hidden" name="targetSubCategoryIdsJson" value={JSON.stringify(subCategoryIds)} readOnly />

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="space-y-1">
          <Label htmlFor="showOnAllProducts" className="font-label-md">แสดงกับสินค้าทุกตัว</Label>
          <p className="font-body-sm text-muted-foreground">
            เปิดไว้เมื่อเป็นโปรโมชั่นทั้งร้าน — จะขึ้นในหน้ารายละเอียดสินค้าทุกชิ้นโดยไม่ต้องเลือกรายการด้านล่าง
          </p>
        </div>
        <Switch id="showOnAllProducts" checked={showAll} onCheckedChange={setShowAllDirty} />
      </div>

      <div className={cn("space-y-5", showAll && "opacity-50")}>
        {showAll ? (
          <p className="font-body-sm text-muted-foreground">
            ตอนนี้แสดงกับสินค้าทุกตัวอยู่ รายการที่เลือกไว้ด้านล่างถูกเก็บไว้ให้ และจะกลับมาใช้ทันทีที่ปิดสวิตช์ด้านบน
          </p>
        ) : null}

        <OptionSection
          label="หมวดหมู่หลัก"
          description="สินค้าทุกชิ้นในหมวดหมู่ที่เลือกจะเห็นโปรโมชั่นนี้"
          options={categoryOptions}
          selectedIds={categoryIds}
          onChange={setCategoryIdsDirty}
          addLabel="เพิ่มหมวดหมู่หลัก"
          emptyText="ยังไม่ได้เลือกหมวดหมู่หลัก"
        />

        <OptionSection
          label="หมวดหมู่ย่อย"
          description="เจาะจงเฉพาะหมวดหมู่ย่อย โดยไม่กระทบสินค้าอื่นในหมวดหมู่หลักเดียวกัน"
          options={subCategoryOptions}
          selectedIds={subCategoryIds}
          onChange={setSubCategoryIdsDirty}
          addLabel="เพิ่มหมวดหมู่ย่อย"
          emptyText="ยังไม่ได้เลือกหมวดหมู่ย่อย"
        />

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <Label className="font-label-md">สินค้าเจาะจง</Label>
              <p className="font-body-sm text-muted-foreground">เลือกทีละชิ้นเมื่อโปรโมชั่นใช้กับสินค้าบางรายการเท่านั้น</p>
            </div>
            <ProductPickerDialog
              selectedIds={new Set(products.map((product) => product.id))}
              onAdd={(product) => setProductsDirty([...products, product])}
            />
          </div>
          {products.length ? (
            <div className="flex flex-wrap gap-2">
              {products.map((product) => (
                <Chip
                  key={product.id}
                  label={product.nameTh}
                  hint={product.published ? product.sku : `${product.sku} · ฉบับร่าง`}
                  onRemove={() => setProductsDirty(products.filter((item) => item.id !== product.id))}
                />
              ))}
            </div>
          ) : (
            <p className="font-body-sm text-muted-foreground">ยังไม่ได้เลือกสินค้าเจาะจง</p>
          )}
        </div>
      </div>

      {!showAll && boundCount === 0 ? (
        <p className="rounded-md border border-dashed p-3 font-body-sm text-muted-foreground">
          ยังไม่ได้ผูกกับอะไรเลย โปรโมชั่นนี้จะแสดงที่หน้าข่าว/โปรโมชั่นตามปกติ แต่จะไม่ขึ้นในหน้ารายละเอียดสินค้า
        </p>
      ) : null}
    </div>
  );
}

function Chip({ label, hint, onRemove }: { label: string; hint?: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1.5 py-1 pr-1 font-label-sm">
      <span>{label}</span>
      {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      <button type="button" aria-label={`นำ ${label} ออก`} onClick={onRemove} className="rounded-sm hover:bg-foreground/10">
        <X className="size-3" />
      </button>
    </Badge>
  );
}

/** Chip list + combobox for a fully client-side option list (the catalog tree). */
function OptionSection({
  label,
  description,
  options,
  selectedIds,
  onChange,
  addLabel,
  emptyText,
}: {
  label: string;
  description: string;
  options: Option[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  addLabel: string;
  emptyText: string;
}) {
  const byId = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
  const selected = selectedIds.map((id) => byId.get(id)).filter((option): option is Option => !!option);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <Label className="font-label-md">{label}</Label>
          <p className="font-body-sm text-muted-foreground">{description}</p>
        </div>
        <OptionPicker
          options={options.filter((option) => !selectedIds.includes(option.id))}
          label={addLabel}
          onPick={(option) => onChange([...selectedIds, option.id])}
        />
      </div>
      {selected.length ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              onRemove={() => onChange(selectedIds.filter((id) => id !== option.id))}
            />
          ))}
        </div>
      ) : (
        <p className="font-body-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function OptionPicker({ options, label, onPick }: { options: Option[]; label: string; onPick: (option: Option) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={options.length === 0}>
          <Plus className="size-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Command>
          <CommandInput placeholder="ค้นหา (ไทย หรือ อังกฤษ)" />
          <CommandList>
            <CommandEmpty className="py-3 font-body-sm">ไม่พบรายการที่ค้นหา</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                // cmdk filters on `value`, so both languages go in to keep the
                // English name searchable even though the chip shows Thai.
                <CommandItem
                  key={option.id}
                  value={option.searchText}
                  onSelect={() => { onPick(option); setOpen(false); }}
                >
                  <ChevronRight className="size-4 text-muted-foreground" />
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Paged product search, same shape as the featured-products picker. The catalog
 * is far too large to ship to the client, so this hits the admin API with a
 * debounced query instead of filtering in memory.
 */
function ProductPickerDialog({ selectedIds, onAdd }: { selectedIds: Set<number>; onAdd: (product: TargetProduct) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: TargetProduct[]; totalPages: number }>({ items: [], totalPages: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(query); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ query: debounced, page: String(page), pool: "all" });
      const response = await fetch(`/api/admin/products?${params}`);
      const json = await response.json().catch(() => ({}));
      if (response.ok) setData({ items: json.items ?? [], totalPages: json.totalPages ?? 1 });
    } finally {
      setLoading(false);
    }
  }, [debounced, page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (open) void load(); }, [open, load]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="size-3.5" />
          เพิ่มสินค้า
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>เลือกสินค้าที่จะผูกกับโปรโมชั่น</DialogTitle>
          <DialogDescription className="font-body-sm">
            ค้นหาแล้วกดที่สินค้าเพื่อเพิ่ม เลือกสินค้าที่ยังเป็นฉบับร่างได้ โปรโมชั่นจะขึ้นเองเมื่อสินค้าถูกเผยแพร่
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ หรือ SKU" className="pl-9 font-body-sm" />
        </div>
        <div className="max-h-[50vh] min-h-[12rem] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : data.items.length ? (
            <div className="space-y-2">
              {data.items.map((product) => {
                const already = selectedIds.has(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={already}
                    onClick={() => onAdd(product)}
                    className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition hover:border-primary/50 hover:shadow-blue-sm disabled:pointer-events-none disabled:opacity-50"
                  >
                    <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                      {product.coverImage ? <Image src={product.coverImage} alt={product.nameTh} fill className="object-cover" sizes="48px" unoptimized /> : <Package className="size-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-md font-semibold">{product.nameTh}</p>
                      <p className="truncate font-body-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                    {!product.published ? <Badge variant="outline" className="shrink-0">ฉบับร่าง</Badge> : null}
                    {already ? <Badge variant="secondary" className="shrink-0">เพิ่มแล้ว</Badge> : <Plus className="size-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="py-16 text-center font-body-sm text-muted-foreground">ไม่พบสินค้าตามที่ค้นหา</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="font-body-sm text-muted-foreground">หน้า {page} จาก {data.totalPages}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>ก่อนหน้า</Button>
            <Button type="button" variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((prev) => prev + 1)}>ถัดไป</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
