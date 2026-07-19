"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteContentAction } from "@/app/admin/(panel)/content/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteContentButton({ resource, id, title, published }: { resource: string; id: number; title: string; published: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const isValid = confirmation.trim().toUpperCase() === "DELETE";

  return (
    <span title={published ? "กรุณายกเลิกการเผยแพร่ก่อนลบ" : undefined} className="inline-block">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={published} aria-label={`ลบ ${title || "รายการ"}`}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบรายการถาวร</AlertDialogTitle>
            <AlertDialogDescription>
              {published
                ? "กรุณายกเลิกเผยแพร่ก่อนลบ (เข้าหน้าแก้ไข แล้วกด 'ยกเลิกเผยแพร่')"
                : <>พิมพ์ <strong>DELETE</strong> เพื่อยืนยัน การดำเนินการนี้ย้อนกลับไม่ได้</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            action={async (formData) => {
              await deleteContentAction(formData);
              setOpen(false);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="resource" value={resource} />
            <input type="hidden" name="id" value={id} />
            <Input
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="พิมพ์ DELETE"
              className="font-body-sm"
            />
            <AlertDialogFooter>
              <AlertDialogCancel type="button">ยกเลิก</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={!isValid}>
                ลบถาวร
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </span>
  );
}
