"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { setMaintenanceModeAction } from "@/app/admin/(panel)/settings/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * สวิตช์เปิด/ปิดโหมดปิดปรับปรุงมีผลทันที เช่นเดียวกับโหมดไว้อาลัย — พลิกปุ๊บ
 * บันทึกปั๊บ ไม่ต้องกดปุ่มบันทึกซ้ำ ข้อความบนหน้าถูกแก้แยกจากฟอร์มข้อความ
 */
export function MaintenanceModeToggle({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(enabled);

  function handleChange(next: boolean) {
    startTransition(async () => {
      setOptimistic(next);
      const formData = new FormData();
      formData.set("enabled", String(next));
      try {
        await setMaintenanceModeAction(formData);
        toast.success(next ? "เปิดโหมดปิดปรับปรุงแล้ว" : "ปิดโหมดปิดปรับปรุงแล้ว");
      } catch {
        toast.error("บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่");
      }
    });
  }

  return (
    <div className="flex items-start justify-between gap-6 rounded-lg border p-4">
      <div className="space-y-1">
        <Label htmlFor="maintenance-mode" className="font-label-md font-semibold">
          เปิดโหมดปิดปรับปรุงเว็บไซต์
        </Label>
        <p className="font-body-sm text-muted-foreground">
          {optimistic ? "แสดงหน้าปิดปรับปรุงแทนเว็บสาธารณะทั้งหมด" : "ปิดใช้งาน"}
        </p>
      </div>
      <Switch
        id="maintenance-mode"
        checked={optimistic}
        onCheckedChange={handleChange}
        disabled={pending}
        aria-label="โหมดปิดปรับปรุงเว็บไซต์"
      />
    </div>
  );
}
