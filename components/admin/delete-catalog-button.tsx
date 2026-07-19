"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteCatalogAction } from "@/app/admin/(panel)/catalog/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteCatalogButton({ resource, id }: { resource: string; id: number }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const isValid = value.trim().toUpperCase() === "DELETE";

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="ลบ">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบข้อมูลอ้างอิง</AlertDialogTitle>
          <AlertDialogDescription>
            ลบได้เฉพาะข้อมูลที่ไม่มีสินค้าใช้งาน พิมพ์ <strong>DELETE</strong> เพื่อยืนยัน
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          action={async (formData) => {
            await deleteCatalogAction(formData);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="resource" value={resource} />
          <input type="hidden" name="id" value={id} />
          <Input
            name="confirmation"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="พิมพ์ DELETE"
            className="font-body-sm"
          />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">ยกเลิก</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={!isValid}>
              ลบข้อมูล
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
