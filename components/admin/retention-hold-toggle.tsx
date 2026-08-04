"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setRetentionHoldAction } from "@/app/admin/(panel)/quotations/actions";
import { Switch } from "@/components/ui/switch";

/**
 * สลับกำหนดเก็บข้อมูลของคำขอหนึ่งใบระหว่าง 3 ปี (ค่าเริ่มต้น) กับ 10 ปี (ลูกค้าซื้อจริง)
 *
 * ใช้ useTransition แทน <form action> เพราะต้องอ่านผลลัพธ์มาเลือกสี toast แบบเดียวกับ
 * ResendLineNotificationButton — การกดปุ่มนี้ผิดหมายถึงข้อมูลลูกค้าหายก่อนกำหนด
 */
export function RetentionHoldToggle({ id, held }: { id: number; held: boolean }) {
  const [pending, startTransition] = useTransition();

  const toggle = (next: boolean) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      if (next) formData.set("hold", "on");
      try {
        const result = await setRetentionHoldAction(formData);
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
      } catch {
        toast.error("บันทึกกำหนดเก็บข้อมูลไม่สำเร็จ กรุณาลองใหม่");
      }
    });
  };

  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={`retention-hold-${id}`} className="font-body-sm">
        ลูกค้ารายนี้สั่งซื้อจริง เก็บข้อมูลไว้ 10 ปี
      </label>
      <Switch
        id={`retention-hold-${id}`}
        checked={held}
        disabled={pending}
        onCheckedChange={toggle}
      />
    </div>
  );
}
