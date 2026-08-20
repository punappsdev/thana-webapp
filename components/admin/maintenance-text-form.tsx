"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { saveMaintenanceTextAction } from "@/app/admin/(panel)/settings/actions";
import type { SiteSettings } from "@/lib/admin/site-settings";
import { useNoResetSubmit } from "@/lib/use-no-reset-submit";
import { type ActionResult } from "@/lib/admin/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionResult = { success: false, message: "" };

/** ข้อความหัวข้อ/รายละเอียดหน้าปิดปรับปรุง แยกไทย-อังกฤษ บันทึกด้วยปุ่มด้านล่าง */
export function MaintenanceTextForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveMaintenanceTextAction, initialState);
  const handleSubmit = useNoResetSubmit(action);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="maintenanceTitleTh">หัวข้อ (ไทย)</Label>
          <Input
            id="maintenanceTitleTh"
            name="maintenanceTitleTh"
            defaultValue={settings.maintenanceTitleTh ?? ""}
            placeholder="เว็บไซต์อยู่ระหว่างการปรับปรุง"
          />
          <FieldError message={state.fieldErrors?.maintenanceTitleTh?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maintenanceTitleEn">หัวข้อ (อังกฤษ)</Label>
          <Input
            id="maintenanceTitleEn"
            name="maintenanceTitleEn"
            defaultValue={settings.maintenanceTitleEn ?? ""}
            placeholder="Website Under Maintenance"
          />
          <FieldError message={state.fieldErrors?.maintenanceTitleEn?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maintenanceMessageTh">รายละเอียด (ไทย)</Label>
          <Textarea
            id="maintenanceMessageTh"
            name="maintenanceMessageTh"
            defaultValue={settings.maintenanceMessageTh ?? ""}
            placeholder="ขออภัยในความไม่สะดวก โปรดกลับมาเยี่ยมชมใหม่ในภายหลัง"
            rows={3}
          />
          <FieldError message={state.fieldErrors?.maintenanceMessageTh?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maintenanceMessageEn">รายละเอียด (อังกฤษ)</Label>
          <Textarea
            id="maintenanceMessageEn"
            name="maintenanceMessageEn"
            defaultValue={settings.maintenanceMessageEn ?? ""}
            placeholder="We apologize for the inconvenience. Please check back later."
            rows={3}
          />
          <FieldError message={state.fieldErrors?.maintenanceMessageEn?.[0]} />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        <Save className="size-4" />
        {pending ? "กำลังบันทึก..." : "บันทึกข้อความ"}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="font-body-sm text-destructive">{message}</p>;
}
