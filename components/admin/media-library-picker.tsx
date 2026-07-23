"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { FileText, Images, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { MediaAccept } from "@/components/admin/media-field";

type Asset = { id: string; url: string; originalName: string; kind: "IMAGE" | "PDF"; size: number };

/** Lets the admin reuse an already-uploaded file instead of uploading a new copy. */
export function MediaLibraryPicker({ accept, onSelect }: { accept: MediaAccept; onSelect: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Asset[]; totalPages: number }>({ items: [], totalPages: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(query); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ kind: accept, query: debounced, page: String(page) });
      const response = await fetch(`/api/admin/media?${params}`);
      const json = await response.json().catch(() => ({}));
      if (response.ok) setData({ items: json.items ?? [], totalPages: json.totalPages ?? 1 });
    } finally {
      setLoading(false);
    }
  }, [accept, debounced, page]);

  // Fetch when the dialog opens or the query/page changes; the loading flag is a
  // deliberate part of this data-fetch effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (open) void load(); }, [open, load]);

  const pick = (url: string) => { onSelect(url); setOpen(false); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Images className="size-3.5" />เลือกจากคลังไฟล์
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>เลือกจากคลังไฟล์</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อไฟล์" className="pl-9 font-body-sm" />
        </div>
        <div className="max-h-[50vh] min-h-[12rem] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : data.items.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {data.items.map((asset) => (
                <button key={asset.id} type="button" onClick={() => pick(asset.url)} className="group overflow-hidden rounded-lg border text-left transition hover:border-primary/50 hover:shadow-blue-sm">
                  <div className="relative flex aspect-square items-center justify-center bg-muted">
                    {asset.kind === "IMAGE" ? <Image src={asset.url} alt={asset.originalName} fill className="object-cover" sizes="150px" unoptimized /> : <FileText className="size-10 text-primary" />}
                  </div>
                  <p className="truncate p-2 font-label-sm" title={asset.originalName}>{asset.originalName}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-16 text-center font-body-sm text-muted-foreground">ไม่พบไฟล์ในคลัง</p>
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
