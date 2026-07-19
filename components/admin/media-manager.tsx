"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MediaUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const upload = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return toast.error("กรุณาเลือกไฟล์");
    setPending(true);
    const formData = new FormData(); formData.set("file", file);
    const response = await fetch("/api/admin/media", { method: "POST", body: formData });
    const data = await response.json();
    setPending(false);
    if (!response.ok) return toast.error(data.message || "อัปโหลดไม่สำเร็จ");
    toast.success("อัปโหลดไฟล์สำเร็จ");
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  };
  return <div className="flex flex-col gap-3 md:flex-row"><Input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="font-body-sm" /><Button type="button" onClick={upload} disabled={pending}><Upload className="size-4" />{pending ? "กำลังอัปโหลด..." : "อัปโหลด"}</Button></div>;
}

export function MediaActions({ id, url }: { id: string; url: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const remove = async () => { setPending(true); const response = await fetch("/api/admin/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); const data = await response.json(); setPending(false); if (!response.ok) return toast.error(data.message || "ลบไม่สำเร็จ"); toast.success("ลบไฟล์แล้ว"); router.refresh(); };
  return <div className="flex gap-1"><Button type="button" variant="ghost" size="icon-sm" aria-label="คัดลอก URL" onClick={async () => { await navigator.clipboard.writeText(url); toast.success("คัดลอก URL แล้ว"); }}><Copy className="size-4" /></Button><AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="ลบไฟล์" disabled={pending}><Trash2 className="size-4 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>ลบไฟล์ถาวร</AlertDialogTitle><AlertDialogDescription>ระบบจะลบได้เฉพาะไฟล์ที่ไม่ถูกอ้างอิงโดยสินค้า ข่าว บทความ ผลงาน หรือโปรโมชั่น</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>ยกเลิก</AlertDialogCancel><AlertDialogAction type="button" onClick={remove} disabled={pending}>{pending ? "กำลังลบ..." : "ลบไฟล์"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>;
}
