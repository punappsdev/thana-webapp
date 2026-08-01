"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { recordActivity } from "@/lib/admin/audit";
import { getPrisma } from "@/lib/prisma";

/**
 * Removes a quotation request outright — used for spam and test submissions.
 * The line items go with it via the Cascade on QuotationItem.requestId.
 */
export async function deleteQuotationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("Invalid quotation request");

  const prisma = getPrisma();
  const request = await prisma.quotationRequest.findUniqueOrThrow({
    where: { id },
    select: { code: true, firstName: true, lastName: true },
  });

  await prisma.quotationRequest.delete({ where: { id } });

  await recordActivity({
    adminId: admin.id,
    action: "DELETE",
    entityType: "quotations",
    entityId: id,
    label: request.code,
    metadata: { customer: `${request.firstName} ${request.lastName}`.trim() },
  });

  revalidatePath("/admin/quotations");
}
