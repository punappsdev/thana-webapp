"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LogIn } from "lucide-react";
import { loginAction } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/admin/validation";

const initialState: ActionResult = { success: false, message: "" };

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="mt-2 w-full" disabled={pending}>
      <LogIn className="size-4" aria-hidden="true" />
      {pending ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
    </Button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="mt-6 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="font-label-md">อีเมล</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="font-body-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="font-label-md">รหัสผ่าน</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="font-body-sm" />
      </div>
      {state.message ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-error-container px-3 py-2 font-body-sm text-on-error-container">
          {state.message}
        </p>
      ) : null}
      <LoginButton />
    </form>
  );
}
