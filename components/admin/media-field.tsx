"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type MediaAccept = "image" | "pdf" | "any";

/** Mirrors validateUploadMetadata in lib/admin/security.ts so the user gets told before the upload. */
const RULES: Record<MediaAccept, { accept: string; maxBytes: number; hint: string }> = {
  image: { accept: "image/jpeg,image/png,image/webp", maxBytes: 10 * 1024 * 1024, hint: "JPG, PNG หรือ WebP ไม่เกิน 10 MB" },
  pdf: { accept: "application/pdf", maxBytes: 25 * 1024 * 1024, hint: "PDF ไม่เกิน 25 MB" },
  any: { accept: "image/jpeg,image/png,image/webp,application/pdf", maxBytes: 25 * 1024 * 1024, hint: "JPG, PNG, WebP ไม่เกิน 10 MB หรือ PDF ไม่เกิน 25 MB" },
};

/**
 * Uploads a file straight from the admin's machine into UPLOAD_DIR via
 * /api/admin/media and keeps the returned URL. The URL is what every server
 * action already expects, so a hidden input carries it when `name` is given;
 * pass `value`/`onChange` instead to drive it from parent state.
 */
export function MediaField({
  name,
  label,
  accept = "image",
  defaultValue,
  value,
  onChange,
  compact = false,
  className,
}: {
  name?: string;
  label?: string;
  accept?: MediaAccept;
  defaultValue?: string | null;
  value?: string;
  onChange?: (url: string) => void;
  compact?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [internal, setInternal] = useState(defaultValue || "");
  const [pending, setPending] = useState(false);
  const [dragging, setDragging] = useState(false);

  const isControlled = value !== undefined;
  const url = isControlled ? value : internal;
  const rules = RULES[accept];

  const setUrl = (next: string) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const upload = async (file: File) => {
    if (file.size > rules.maxBytes) {
      return toast.error(`ไฟล์ใหญ่เกินไป — รองรับ ${rules.hint}`);
    }
    setPending(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return toast.error(data.message || "อัปโหลดไม่สำเร็จ");
      setUrl(data.asset.url);
      toast.success(`อัปโหลด ${file.name} แล้ว`);
    } catch {
      toast.error("อัปโหลดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isPdf = url.toLowerCase().endsWith(".pdf");

  const hiddenInput = name ? <input type="hidden" name={name} value={url} readOnly /> : null;
  const filePicker = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={rules.accept}
      className="sr-only"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void upload(file);
      }}
    />
  );

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {hiddenInput}
        {filePicker}
        {url ? <Preview url={url} isPdf={isPdf} size={36} /> : null}
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => inputRef.current?.click()}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          {url ? "เปลี่ยน" : "อัปโหลด"}
        </Button>
        {url ? (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="ลบไฟล์" onClick={() => setUrl("")}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label htmlFor={inputId} className="font-label-md">{label}</Label> : null}
      {hiddenInput}
      {filePicker}
      
      {!url ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) void upload(file);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center text-center gap-3 rounded-lg border border-dashed p-6 transition-all cursor-pointer select-none",
            dragging
              ? "border-primary bg-primary/5 shadow-blue-sm"
              : "border-border bg-muted/10 hover:bg-muted/30 hover:border-input",
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-background border shadow-sm">
            {pending ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (
              <Upload className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <p className="font-label-sm text-foreground font-medium">
              {pending ? "กำลังอัปโหลด..." : "คลิกเพื่อเลือกไฟล์ หรือลากมาวาง"}
            </p>
            <p className="font-label-sm text-muted-foreground/80">{rules.hint}</p>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col gap-3 rounded-lg border border-solid p-3 bg-card shadow-blue-sm"
        >
          {/* Line 1: Preview & Info */}
          <div className="flex items-center gap-3 min-w-0">
            <Preview url={url} isPdf={isPdf} size={48} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-body-sm font-medium text-foreground" title={url}>
                {decodeURIComponent(url.split("/").pop() || url)}
              </p>
              <p className="font-label-sm text-muted-foreground">อัปโหลดแล้ว</p>
            </div>
          </div>

          {/* Line 2: Actions */}
          <div className="flex items-center justify-end gap-1.5 pt-2.5 border-t border-muted">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="h-8 px-3 font-label-sm gap-1.5"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              <span>เปลี่ยนไฟล์</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="ลบไฟล์"
              onClick={(e) => {
                e.stopPropagation();
                setUrl("");
              }}
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Preview({ url, isPdf, size }: { url: string; isPdf: boolean; size: number }) {
  if (isPdf) {
    return (
      <div className="flex shrink-0 items-center justify-center rounded-md bg-muted" style={{ width: size, height: size }}>
        <FileText className="size-5 text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="relative shrink-0 overflow-hidden rounded-md border bg-muted" style={{ width: size, height: size }}>
      <Image src={url} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized />
    </div>
  );
}
