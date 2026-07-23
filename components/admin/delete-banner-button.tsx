"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBannerAction } from "@/app/admin/(panel)/banners/actions";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteBannerButton({ id, title, published }: { id: number; title: string; published: boolean }) {
  const [open, setOpen] = useState(false);

  // Published banners must be unpublished first, so disable the button up front
  // instead of surfacing an error after the fact.
  if (published) {
    return (
      <span title="กรุณายกเลิกการเผยแพร่ก่อนลบ" className="inline-block">
        <Button variant="ghost" size="icon-sm" disabled aria-label={`ลบ ${title || "แบนเนอร์"}`}>
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </span>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`ลบ ${title || "แบนเนอร์"}`}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบแบนเนอร์ถาวร</AlertDialogTitle>
          <AlertDialogDescription>
            ต้องการลบ{title ? ` “${title}”` : "แบนเนอร์นี้"} ใช่หรือไม่? การดำเนินการนี้ย้อนกลับไม่ได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          action={async (formData) => {
            try { await deleteBannerAction(formData); setOpen(false); }
            catch { toast.error("ลบแบนเนอร์ไม่สำเร็จ กรุณาลองใหม่"); }
          }}
        >
          <input type="hidden" name="id" value={id} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">ยกเลิก</AlertDialogCancel>
            <Button type="submit" variant="destructive">ลบถาวร</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
