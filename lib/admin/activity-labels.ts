import type { AdminActivityAction } from "@/generated/prisma/client";
import { catalogLabels, isCatalogResource } from "@/lib/admin/catalog-config";
import { contentConfigs, isContentResource } from "@/lib/admin/content-config";

// The activity log stores raw enum actions and resource keys. These helpers turn
// them into Thai for the dashboard and the activity page so non-technical admins
// don't see "CREATE" / "attribute-values" strings.

export const activityActionLabels: Record<AdminActivityAction, string> = {
  CREATE: "สร้าง",
  UPDATE: "แก้ไข",
  PUBLISH: "เผยแพร่",
  UNPUBLISH: "ยกเลิกเผยแพร่",
  DELETE: "ลบ",
  LOGIN: "เข้าสู่ระบบ",
  LOGOUT: "ออกจากระบบ",
  PASSWORD_CHANGE: "เปลี่ยนรหัสผ่าน",
  UPLOAD: "อัปโหลดไฟล์",
};

export function activityActionLabel(action: string): string {
  return (activityActionLabels as Record<string, string>)[action] ?? action;
}

export function activityActionVariant(action: string): "default" | "secondary" | "destructive" {
  if (action === "DELETE") return "destructive";
  if (action === "PUBLISH") return "default";
  return "secondary";
}

const extraEntityLabels: Record<string, string> = { products: "สินค้า" };

export function entityTypeLabel(type: string): string {
  if (type in extraEntityLabels) return extraEntityLabels[type];
  if (isCatalogResource(type)) return catalogLabels[type];
  if (isContentResource(type)) return contentConfigs[type].plural;
  return type;
}
