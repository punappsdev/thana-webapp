"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteProductAction } from "@/app/admin/(panel)/products/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function DeleteProductButton({ id, name, published }: { id: number; name: string; published: boolean }) { const [value, setValue] = useState(""); return <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon-sm" disabled={published} aria-label="ลบสินค้า"><Trash2 className="size-4 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>ลบสินค้าถาวร</AlertDialogTitle><AlertDialogDescription>ยกเลิกเผยแพร่ก่อน แล้วพิมพ์ {name} เพื่อยืนยัน</AlertDialogDescription></AlertDialogHeader><form action={deleteProductAction} className="space-y-4"><input type="hidden" name="id" value={id} /><Input name="confirmation" value={value} onChange={(event) => setValue(event.target.value)} /><AlertDialogFooter><AlertDialogCancel type="button">ยกเลิก</AlertDialogCancel><AlertDialogAction type="submit" disabled={published || value !== name}>ลบสินค้า</AlertDialogAction></AlertDialogFooter></form></AlertDialogContent></AlertDialog>; }
