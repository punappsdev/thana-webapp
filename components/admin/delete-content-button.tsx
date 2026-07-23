"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteContentAction } from "@/app/admin/(panel)/content/actions";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteContentButton({ resource, id, title, published }: { resource: string; id: number; title: string; published: boolean }) {
  const [open, setOpen] = useState(false);

  // Published items must be unpublished first, so disable the button up front
  // instead of surfacing an error after the fact.
  if (published) {
    return (
      <span title="กรุณายกเลิกการเผยแพร่ก่อนลบ" className="inline-block">
        <Button variant="ghost" size="icon-sm" disabled aria-label={`ลบ ${title || "รายการ"}`}>
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </span>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`ลบ ${title || "รายการ"}`}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบรายการถาวร</AlertDialogTitle>
          <AlertDialogDescription>
            ต้องการลบ{title ? ` “${title}”` : "รายการนี้"} ใช่หรือไม่? การดำเนินการนี้ย้อนกลับไม่ได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Close only AFTER the action resolves — see DeleteProductButton note. */}
        <form
          action={async (formData) => {
            try { await deleteContentAction(formData); setOpen(false); }
            catch { toast.error("ลบรายการไม่สำเร็จ กรุณาลองใหม่"); }
          }}
        >
          <input type="hidden" name="resource" value={resource} />
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
