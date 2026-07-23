"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCatalogAction } from "@/app/admin/(panel)/catalog/actions";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteCatalogButton({ resource, id, label, referenced }: { resource: string; id: number; label?: string; referenced?: boolean }) {
  const [open, setOpen] = useState(false);

  // Items that products/other records still point to can't be deleted (the
  // server blocks it), so we disable the button up front instead of letting the
  // admin hit a confusing error.
  if (referenced) {
    return (
      <span title="ถูกใช้งานอยู่ ลบไม่ได้" className="inline-block">
        <Button variant="ghost" size="icon-sm" disabled aria-label="ลบไม่ได้ เพราะถูกใช้งานอยู่">
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </span>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="ลบ">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
          <AlertDialogDescription>
            ต้องการลบ{label ? ` “${label}”` : "รายการนี้"} ใช่หรือไม่? การลบไม่สามารถกู้คืนได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Close only AFTER the action resolves — see DeleteProductButton note. */}
        <form
          action={async (formData) => {
            try { await deleteCatalogAction(formData); setOpen(false); }
            catch { toast.error("ลบไม่สำเร็จ ข้อมูลนี้อาจถูกใช้งานอยู่"); }
          }}
        >
          <input type="hidden" name="resource" value={resource} />
          <input type="hidden" name="id" value={id} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">ยกเลิก</AlertDialogCancel>
            <Button type="submit" variant="destructive">ลบ</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
