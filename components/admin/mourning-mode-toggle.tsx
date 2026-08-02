"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { setMourningModeAction } from "@/app/admin/(panel)/settings/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * The switch flips straight away and the row below it narrates what visitors
 * see, so the admin never has to open the homepage to confirm the change.
 * `useOptimistic` snaps back on its own if the action throws.
 */
export function MourningModeToggle({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(enabled);

  function handleChange(next: boolean) {
    startTransition(async () => {
      setOptimistic(next);
      const formData = new FormData();
      formData.set("enabled", String(next));
      try {
        await setMourningModeAction(formData);
        toast.success(next ? "เปิดโหมดไว้อาลัยแล้ว" : "ปิดโหมดไว้อาลัยแล้ว");
      } catch {
        toast.error("บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่");
      }
    });
  }

  return (
    <div className="flex items-start justify-between gap-6 rounded-lg border p-4">
      <div className="space-y-1">
        <Label htmlFor="mourning-mode" className="font-label-md font-semibold">
          แสดงหน้าแรกเป็นโทนขาวดำ
        </Label>
        <p className="font-body-sm text-muted-foreground">
          {optimistic ? "เปิดใช้งาน" : "ปิดใช้งาน"}
        </p>
      </div>
      <Switch
        id="mourning-mode"
        checked={optimistic}
        onCheckedChange={handleChange}
        disabled={pending}
        aria-label="โหมดไว้อาลัย"
      />
    </div>
  );
}
