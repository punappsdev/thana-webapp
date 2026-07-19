"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteCatalogAction } from "@/app/admin/(panel)/catalog/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteCatalogButton({ resource, id }: { resource: string; id: number }) {
  const [value, setValue] = useState("");
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="ลบ"><Trash2 className="size-4 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>ลบข้อมูลอ้างอิง</AlertDialogTitle><AlertDialogDescription>ลบได้เฉพาะข้อมูลที่ไม่มีสินค้าใช้งาน พิมพ์ DELETE เพื่อยืนยัน</AlertDialogDescription></AlertDialogHeader><form action={deleteCatalogAction} className="space-y-4"><input type="hidden" name="resource" value={resource} /><input type="hidden" name="id" value={id} /><Input name="confirmation" value={value} onChange={(event) => setValue(event.target.value)} /><AlertDialogFooter><AlertDialogCancel type="button">ยกเลิก</AlertDialogCancel><AlertDialogAction type="submit" disabled={value !== "DELETE"}>ลบข้อมูล</AlertDialogAction></AlertDialogFooter></form></AlertDialogContent></AlertDialog>;
}
