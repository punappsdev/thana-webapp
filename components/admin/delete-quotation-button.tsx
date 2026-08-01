"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteQuotationAction } from "@/app/admin/(panel)/quotations/actions";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteQuotationButton({ id, code }: { id: number; code: string }) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`ลบคำขอ ${code}`}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบคำขอใบเสนอราคาถาวร</AlertDialogTitle>
          <AlertDialogDescription>
            ต้องการลบคำขอ “{code}” ใช่หรือไม่? ข้อมูลผู้ติดต่อและรายการสินค้าทั้งหมดจะถูกลบไปด้วย และย้อนกลับไม่ได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Close only AFTER the action resolves. Wrapping the submit in
            AlertDialogAction closes (and unmounts) the form before the server
            action dispatches, so the delete would silently never run. */}
        <form
          action={async (formData) => {
            try { await deleteQuotationAction(formData); setOpen(false); }
            catch { toast.error("ลบคำขอไม่สำเร็จ กรุณาลองใหม่"); }
          }}
        >
          <input type="hidden" name="id" value={id} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">ยกเลิก</AlertDialogCancel>
            <Button type="submit" variant="destructive">ลบคำขอ</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
