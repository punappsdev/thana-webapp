"use client";

import { useTransition } from "react";
import { Crosshair } from "lucide-react";
import { toast } from "sonner";
import { setPopupLiveAction } from "@/app/admin/(panel)/popups/actions";
import { Button } from "@/components/ui/button";

/** Promotes one popup above the others when several qualify at the same time. */
export function SetPopupLiveButton({ id, name }: { id: number; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          try {
            await setPopupLiveAction(formData);
            toast.success(`เปลี่ยนมาแสดง “${name}” แล้ว`);
          } catch {
            toast.error("เปลี่ยน Popup ที่แสดงไม่สำเร็จ กรุณาลองใหม่");
          }
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="outline" size="sm" disabled={pending} className="font-label-sm">
        <Crosshair className="size-3.5" />
        ใช้อันนี้
      </Button>
    </form>
  );
}
