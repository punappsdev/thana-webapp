"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_BYTES = 25 * 1024 * 1024;

/**
 * Drop-zone uploader for the media library. Mirrors the MediaField dropzone
 * style used across the admin panel, but adds the whole batch to the library
 * (refreshing the grid) instead of holding a single value.
 */
export function MediaUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [dragging, setDragging] = useState(false);

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setPending(true);
    let uploaded = 0;
    for (const file of files) {
      const limit = file.type.startsWith("image/") ? MAX_IMAGE_BYTES : MAX_PDF_BYTES;
      if (file.size > limit) {
        toast.error(`${file.name} ใหญ่เกินไป`);
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
        uploaded += 1;
      } catch {
        toast.error(`${file.name}: อัปโหลดไม่สำเร็จ`);
      }
    }
    setPending(false);
    if (inputRef.current) inputRef.current.value = "";
    if (uploaded) {
      toast.success(`อัปโหลด ${uploaded} ไฟล์สำเร็จ`);
      router.refresh();
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf"
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
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center text-center gap-3 rounded-lg border border-dashed p-6 transition-all cursor-pointer select-none",
          dragging
            ? "border-primary bg-primary/5 shadow-blue-sm"
            : "border-border bg-muted/10 hover:bg-muted/30 hover:border-input",
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-background border shadow-sm">
          {pending ? <Loader2 className="size-5 animate-spin text-primary" /> : <Upload className="size-5 text-muted-foreground" />}
        </div>
        <div className="space-y-1">
          <p className="font-label-sm text-foreground font-medium">
            {pending ? "กำลังอัปโหลด..." : "คลิกเพื่อเลือกไฟล์ หรือลากมาวาง"}
          </p>
          <p className="font-label-sm text-muted-foreground/80">JPG, PNG, WebP ไม่เกิน 10 MB หรือ PDF ไม่เกิน 25 MB</p>
        </div>
      </div>
    </>
  );
}

export function MediaActions({ id, url }: { id: string; url: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const remove = async () => { setPending(true); const response = await fetch("/api/admin/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); const data = await response.json(); setPending(false); if (!response.ok) return toast.error(data.message || "ลบไม่สำเร็จ"); toast.success("ลบไฟล์แล้ว"); router.refresh(); };
  return <div className="flex gap-1"><Button type="button" variant="ghost" size="icon-sm" aria-label="คัดลอก URL" onClick={async () => { await navigator.clipboard.writeText(url); toast.success("คัดลอก URL แล้ว"); }}><Copy className="size-4" /></Button><AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="ลบไฟล์" disabled={pending}><Trash2 className="size-4 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>ลบไฟล์ถาวร</AlertDialogTitle><AlertDialogDescription>ระบบจะลบได้เฉพาะไฟล์ที่ไม่ถูกอ้างอิงโดยสินค้า ข่าว บทความ ผลงาน หรือโปรโมชั่น</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>ยกเลิก</AlertDialogCancel><AlertDialogAction type="button" onClick={remove} disabled={pending}>{pending ? "กำลังลบ..." : "ลบไฟล์"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>;
}
