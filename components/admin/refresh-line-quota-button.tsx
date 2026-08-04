"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ดึงตัวเลขโควต้าจาก LINE ใหม่
 *
 * ใช้ `router.refresh()` เฉย ๆ ไม่ต้องมี server action เพราะการ์ดนี้อ่านอย่างเดียว
 * ไม่ได้เขียนอะไรลงฐานข้อมูล — หน้าหลังบ้านเป็น dynamic อยู่แล้ว (อ่าน cookie ใน
 * requireAdminPage) และ fetch ไป LINE ตั้ง cache: "no-store" ไว้ การ refresh จึง
 * ยิงไปถามค่าใหม่จริง ไม่ได้ค่าที่แคชไว้
 */
export function RefreshLineQuotaButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
      {pending ? "กำลังโหลด..." : "รีเฟรช"}
    </Button>
  );
}
