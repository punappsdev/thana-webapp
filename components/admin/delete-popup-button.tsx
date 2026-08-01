"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePopupAction } from "@/app/admin/(panel)/popups/actions";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeletePopupButton({ id, name, published }: { id: number; name: string; published: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`ลบ Popup ${name}`}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบ Popup ถาวร</AlertDialogTitle>
          <AlertDialogDescription>
            {published
              ? `“${name}” ยังเผยแพร่อยู่ กรุณาเปลี่ยนเป็นฉบับร่างก่อนจึงจะลบได้`
              : `ต้องการลบ “${name}” ใช่หรือไม่? การลบย้อนกลับไม่ได้ และรูปจะถูกลบออกจากคลังไฟล์หากไม่มีที่อื่นใช้อยู่`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Close only AFTER the action resolves. Wrapping the submit in
            AlertDialogAction closes (and unmounts) the form before the server
            action dispatches, so the delete would silently never run. */}
        <form
          action={async (formData) => {
            try { await deletePopupAction(formData); setOpen(false); }
            catch { toast.error(published ? "กรุณายกเลิกเผยแพร่ก่อนลบ" : "ลบ Popup ไม่สำเร็จ กรุณาลองใหม่"); }
          }}
        >
          <input type="hidden" name="id" value={id} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">ยกเลิก</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={published}>ลบ Popup</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
