"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type GalleryRow = { _key: string; url: string; altTh: string; altEn: string };

/** Mirrors the image rules in MediaField so the admin is told before the upload. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Multi-image editor for a single record's gallery. Uploads a whole batch in one
 * drop (the media API takes one file per request, so the batch is sent as a
 * sequence like MediaUpload does) and keeps the display order as the array order —
 * `sortOrder` is derived from the index when the parent serializes the rows.
 */
export function GalleryField({
  value,
  onChange,
  max,
  description,
}: {
  value: GalleryRow[];
  onChange: (rows: GalleryRow[]) => void;
  max: number;
  description?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [dragging, setDragging] = useState(false);

  const remaining = max - value.length;
  const isFull = remaining <= 0;

  const addUrls = (urls: string[]) => {
    if (!urls.length) return;
    onChange([...value, ...urls.map((url) => ({ _key: crypto.randomUUID(), url, altTh: "", altEn: "" }))]);
  };

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    if (isFull) return toast.error(`ใส่รูปได้สูงสุด ${max} รูป`);

    // Trim to the remaining quota up front so we never upload a file we'd discard.
    const accepted = files.slice(0, remaining);
    if (files.length > accepted.length) {
      toast.warning(`เลือกมา ${files.length} ไฟล์ แต่เหลือที่ว่างอีก ${remaining} รูป — อัปโหลดเฉพาะ ${accepted.length} ไฟล์แรก`);
    }

    setPending(true);
    const uploaded: string[] = [];
    for (const file of accepted) {
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name} ใหญ่เกินไป — รองรับ JPG, PNG หรือ WebP ไม่เกิน 10 MB`);
        continue;
      }
      try {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch("/api/admin/media", { method: "POST", body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast.error(`${file.name}: ${data.message || "อัปโหลดไม่สำเร็จ"}`);
          continue;
        }
        uploaded.push(data.asset.url);
      } catch {
        toast.error(`${file.name}: อัปโหลดไม่สำเร็จ`);
      }
    }
    setPending(false);
    if (inputRef.current) inputRef.current.value = "";
    if (uploaded.length) {
      addUrls(uploaded);
      toast.success(`อัปโหลด ${uploaded.length} รูปสำเร็จ`);
    }
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const update = (index: number, patch: Partial<GalleryRow>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-headline-sm">รูปในแกลเลอรี ({value.length}/{max})</h3>
          <p className="font-body-sm text-muted-foreground">
            ผู้ชมคลิกที่การ์ดผลงานในหน้าเว็บแล้วเลื่อนดูรูปเหล่านี้ได้ (รูปปกจะถูกใช้เป็นภาพแรกเสมอ)
          </p>
        </div>
        <MediaLibraryPicker
          accept="image"
          onSelect={(url) => (isFull ? toast.error(`ใส่รูปได้สูงสุด ${max} รูป`) : addUrls([url]))}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => void uploadFiles(Array.from(event.target.files ?? []))}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void uploadFiles(Array.from(event.dataTransfer.files ?? []));
        }}
        onClick={() => !isFull && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-all select-none",
          isFull
            ? "border-border bg-muted/20 cursor-not-allowed opacity-70"
            : dragging
              ? "border-primary bg-primary/5 shadow-blue-sm cursor-pointer"
              : "border-border bg-muted/10 hover:bg-muted/30 hover:border-input cursor-pointer",
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-full border bg-background shadow-sm">
          {pending ? <Loader2 className="size-5 animate-spin text-primary" /> : <Upload className="size-5 text-muted-foreground" />}
        </div>
        <p className="font-label-sm font-medium text-foreground">
          {pending
            ? "กำลังอัปโหลด..."
            : isFull
              ? `ครบ ${max} รูปแล้ว — ลบรูปเดิมก่อนจึงจะเพิ่มได้อีก`
              : "คลิกเพื่อเลือกหลายไฟล์พร้อมกัน หรือลากรูปมาวางตรงนี้"}
        </p>
        <p className="font-label-sm text-muted-foreground/80">JPG, PNG หรือ WebP ไม่เกิน 10 MB ต่อรูป</p>
      </div>

      {description ? <p className="font-label-sm text-secondary font-medium">{description}</p> : null}

      {value.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((row, index) => (
            <div key={row._key} className="space-y-2 rounded-lg border bg-card p-3 shadow-blue-sm">
              <div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
                {row.url ? <Image src={row.url} alt="" fill sizes="240px" className="object-cover" unoptimized /> : null}
                <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 font-label-sm text-white backdrop-blur">
                  {index === 0 ? "รูปแรก" : index + 1}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <Button type="button" variant="outline" size="icon-sm" aria-label="เลื่อนไปทางซ้าย" disabled={index === 0} onClick={() => move(index, -1)}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon-sm" aria-label="เลื่อนไปทางขวา" disabled={index === value.length - 1} onClick={() => move(index, 1)}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="ลบรูป" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Input value={row.altTh} onChange={(event) => update(index, { altTh: event.target.value })} placeholder="คำอธิบายรูป (ไทย)" className="font-body-sm h-8" />
              <Input value={row.altEn} onChange={(event) => update(index, { altEn: event.target.value })} placeholder="Image description (English)" className="font-body-sm h-8" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
