"use client";

import { useActionState, useEffect } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction } from "@/app/admin/(panel)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/admin/validation";

const initialState: ActionResult = { success: false, message: "" };
export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);
  useEffect(() => { if (state.message) (state.success ? toast.success : toast.error)(state.message); }, [state]);
  return <form action={action} className="space-y-5">
    {[["currentPassword", "รหัสผ่านปัจจุบัน"], ["newPassword", "รหัสผ่านใหม่"], ["confirmPassword", "ยืนยันรหัสผ่านใหม่"]].map(([name, label]) => <div key={name} className="space-y-2"><Label htmlFor={name} className="font-label-md">{label}</Label><Input id={name} name={name} type="password" autoComplete={name === "currentPassword" ? "current-password" : "new-password"} className="font-body-sm" required />{state.fieldErrors?.[name]?.[0] ? <p className="font-body-sm text-destructive">{state.fieldErrors[name][0]}</p> : null}</div>)}
    <p className="font-body-sm text-muted-foreground">อย่างน้อย 12 ตัวอักษร พร้อมตัวพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และสัญลักษณ์</p>
    <Button type="submit" disabled={pending}><KeyRound className="size-4" />{pending ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}</Button>
  </form>;
}
