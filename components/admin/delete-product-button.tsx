"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProductAction } from "@/app/admin/(panel)/products/actions";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({ id, name, published }: { id: number; name: string; published: boolean }) {
  const [open, setOpen] = useState(false);

  // Published products must be unpublished first, so disable the button up front
  // instead of surfacing an error after the fact.
  if (published) {
    return (
      <span title="กรุณายกเลิกการเผยแพร่ก่อนลบ" className="inline-block">
        <Button variant="ghost" size="icon-sm" disabled aria-label={`ลบ ${name || "สินค้า"}`}>
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </span>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`ลบ ${name || "สินค้า"}`}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบสินค้าถาวร</AlertDialogTitle>
          <AlertDialogDescription>
            ต้องการลบ{name ? ` “${name}”` : "สินค้านี้"} ใช่หรือไม่? การดำเนินการนี้ย้อนกลับไม่ได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Close only AFTER the action resolves. Wrapping the submit in
            AlertDialogAction closes (and unmounts) the form before the server
            action dispatches, so the delete would silently never run. */}
        <form
          action={async (formData) => {
            try { await deleteProductAction(formData); setOpen(false); }
            catch { toast.error("ลบสินค้าไม่สำเร็จ กรุณาลองใหม่"); }
          }}
        >
          <input type="hidden" name="id" value={id} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">ยกเลิก</AlertDialogCancel>
            <Button type="submit" variant="destructive">ลบสินค้า</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
