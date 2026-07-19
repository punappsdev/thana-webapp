"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteContentAction } from "@/app/admin/(panel)/content/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteContentButton({ resource, id, title, published }: { resource: string; id: number; title: string; published: boolean }) {
  const [confirmation, setConfirmation] = useState("");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="ghost" size="icon-sm" disabled={published} aria-label={`ลบ ${title}`}><Trash2 className="size-4 text-destructive" /></Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>ลบรายการถาวร</AlertDialogTitle><AlertDialogDescription>{published ? "กรุณายกเลิกเผยแพร่ก่อนลบ" : <>พิมพ์ <strong>{title}</strong> เพื่อยืนยัน การดำเนินการนี้ย้อนกลับไม่ได้</>}</AlertDialogDescription></AlertDialogHeader>
        <form action={deleteContentAction} className="space-y-4">
          <input type="hidden" name="resource" value={resource} /><input type="hidden" name="id" value={id} />
          <Input name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="font-body-sm" />
          <AlertDialogFooter><AlertDialogCancel type="button">ยกเลิก</AlertDialogCancel><AlertDialogAction type="submit" disabled={confirmation !== title}>ลบถาวร</AlertDialogAction></AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
