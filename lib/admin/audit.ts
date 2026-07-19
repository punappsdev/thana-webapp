import "server-only";

import type { AdminActivityAction, Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export async function recordActivity(input: {
  adminId?: string | null;
  action: AdminActivityAction;
  entityType: string;
  entityId?: string | number | null;
  label?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return getPrisma().activityLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId === null || input.entityId === undefined ? null : String(input.entityId),
      label: input.label?.slice(0, 255),
      metadata: input.metadata,
    },
  });
}
