"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImageIcon, Loader2, Package, Plus, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import { addFeaturedAction, removeFeaturedAction, reorderFeaturedAction } from "@/app/admin/(panel)/featured/actions";
import type { FeaturedProduct } from "@/lib/admin/featured-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const HOMEPAGE_LIMIT = 8;

type PickerItem = { id: number; nameTh: string; nameEn: string; sku: string; coverImage: string | null; category: string | null };

function Thumb({ url, alt }: { url: string | null; alt: string }) {
  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
      {url ? <Image src={url} alt={alt} fill className="object-cover" sizes="56px" unoptimized /> : <ImageIcon className="size-5 text-muted-foreground" />}
    </div>
  );
}

export function FeaturedProductsManager({ initial }: { initial: FeaturedProduct[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  // Apply an optimistic list immediately, then reconcile with the server. On
  // failure roll back to the snapshot; on success revalidate so other views (the
  // homepage) pick up the change. `silent` skips the success toast for reorders,
  // which fire on every arrow click.
  const mutate = (optimistic: FeaturedProduct[], action: () => Promise<{ success: boolean; message: string }>, silent = false) => {
    const snapshot = items;
    setItems(optimistic);
    startTransition(async () => {
      const result = await action();
      if (result.success) { if (!silent) toast.success(result.message); router.refresh(); }
      else { toast.error(result.message); setItems(snapshot); }
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    mutate(next, () => reorderFeaturedAction(next.map((item) => item.id)), true);
  };

  const remove = (id: number) => mutate(items.filter((item) => item.id !== id), () => removeFeaturedAction(id));

  const add = (product: PickerItem) => {
    if (items.some((item) => item.id === product.id)) return;
    mutate([...items, { ...product, published: true }], () => addFeaturedAction(product.id));
  };

  const featuredIds = new Set(items.map((item) => item.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline-lg font-semibold">สินค้าแนะนำหน้าแรก</h1>
          <p className="font-body-sm text-muted-foreground mt-1">
            เลือกและจัดลำดับสินค้าที่แสดงในส่วน “สินค้าแนะนำ” บนหน้าแรก — แสดงสูงสุด {HOMEPAGE_LIMIT} ชิ้นตามลำดับด้านล่าง
          </p>
        </div>
        <AddFeaturedDialog featuredIds={featuredIds} disabled={pending} onAdd={add} />
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted"><Star className="size-6 text-muted-foreground" /></div>
            <p className="font-body-md text-muted-foreground">ยังไม่มีสินค้าแนะนำ — ส่วนนี้จะไม่แสดงบนหน้าแรกจนกว่าจะเพิ่มสินค้า</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <div className="flex w-8 shrink-0 flex-col items-center">
                  <span className="font-label-md font-semibold text-muted-foreground">{index + 1}</span>
                  {index >= HOMEPAGE_LIMIT ? <span className="font-label-sm text-muted-foreground">ซ่อน</span> : null}
                </div>
                <Thumb url={item.coverImage} alt={item.nameTh} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-label-md font-semibold">{item.nameTh}</p>
                    {!item.published ? <Badge variant="secondary">ฉบับร่าง</Badge> : null}
                  </div>
                  <p className="truncate font-body-sm text-muted-foreground">{item.nameEn}</p>
                  <p className="truncate font-body-sm text-muted-foreground">SKU: {item.sku}{item.category ? ` · ${item.category}` : ""}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon-sm" disabled={pending || index === 0} onClick={() => move(index, -1)} aria-label="เลื่อนขึ้น"><ArrowUp className="size-4" /></Button>
                  <Button variant="ghost" size="icon-sm" disabled={pending || index === items.length - 1} onClick={() => move(index, 1)} aria-label="เลื่อนลง"><ArrowDown className="size-4" /></Button>
                  <Button variant="ghost" size="icon-sm" disabled={pending} onClick={() => remove(item.id)} aria-label="นำออก"><X className="size-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AddFeaturedDialog({ featuredIds, disabled, onAdd }: { featuredIds: Set<number>; disabled: boolean; onAdd: (product: PickerItem) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: PickerItem[]; totalPages: number }>({ items: [], totalPages: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(query); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ query: debounced, page: String(page) });
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
        <Button disabled={disabled}><Plus className="size-4" />เพิ่มสินค้าแนะนำ</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>เพิ่มสินค้าแนะนำ</DialogTitle>
          <DialogDescription className="font-body-sm">เลือกจากสินค้าที่เผยแพร่แล้ว กดที่สินค้าเพื่อเพิ่มเข้าลิสต์</DialogDescription>
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
                const already = featuredIds.has(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={already || disabled}
                    onClick={() => onAdd(product)}
                    className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition hover:border-primary/50 hover:shadow-blue-sm disabled:pointer-events-none disabled:opacity-50"
                  >
                    <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                      {product.coverImage ? <Image src={product.coverImage} alt={product.nameTh} fill className="object-cover" sizes="48px" unoptimized /> : <Package className="size-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-md font-semibold">{product.nameTh}</p>
                      <p className="truncate font-body-sm text-muted-foreground">SKU: {product.sku}{product.category ? ` · ${product.category}` : ""}</p>
                    </div>
                    {already ? <Badge variant="secondary" className="shrink-0">เพิ่มแล้ว</Badge> : <Plus className="size-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="py-16 text-center font-body-sm text-muted-foreground">ไม่พบสินค้าที่เผยแพร่แล้วให้เพิ่ม</p>
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
