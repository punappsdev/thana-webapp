"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { SITE_SETTING_ID } from "@/lib/admin/site-settings";

/** Mourning mode only repaints the homepage, so both locale roots are enough. */
function refreshSettings() {
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/en");
}

export async function setMourningModeAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const raw = formData.get("enabled");
  if (raw !== "true" && raw !== "false") throw new Error("Invalid mourning mode value");
  const mourningMode = raw === "true";

  await getPrisma().siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: { id: SITE_SETTING_ID, mourningMode },
    update: { mourningMode },
  });

  await recordActivity({
    adminId: admin.id,
    action: "UPDATE",
    entityType: "settings",
    entityId: SITE_SETTING_ID,
    label: mourningMode ? "เปิดโหมดไว้อาลัย" : "ปิดโหมดไว้อาลัย",
    metadata: { mourningMode },
  });

  refreshSettings();
}
