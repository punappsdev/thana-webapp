"use client";

import { useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { resendLineNotificationAction } from "@/app/admin/(panel)/quotations/actions";
import { Button } from "@/components/ui/button";

/**
 * ส่งการ์ดแจ้งเตือนเข้ากลุ่ม LINE ของสาขาซ้ำ
 *
 * ใช้ useTransition แทน <form action> เพราะต้องอ่านผลลัพธ์ที่ action คืนมาเพื่อ
 * เลือกสี toast — ส่งไม่ผ่านต้องบอกสาเหตุจริง ไม่ใช่ขึ้นว่าสำเร็จไปทุกครั้ง
 */
export function ResendLineNotificationButton({ id, sent }: { id: number; sent: boolean }) {
  const [pending, startTransition] = useTransition();

  const resend = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      try {
        const result = await resendLineNotificationAction(formData);
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
      } catch {
        toast.error("ส่งแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่");
      }
    });
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={resend} disabled={pending}>
      <Send className="size-4" />
      {pending ? "กำลังส่ง..." : sent ? "ส่งแจ้งเตือนซ้ำ" : "ส่งแจ้งเตือนเข้ากลุ่มไลน์"}
    </Button>
  );
}
