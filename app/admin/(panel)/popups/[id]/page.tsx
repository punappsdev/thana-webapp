import { notFound } from "next/navigation";
import { PopupForm } from "@/components/admin/popup-form";
import { getPopupRecord } from "@/lib/admin/popup-data";

export default async function EditPopupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const record = await getPopupRecord(Number(id));
  if (!record) notFound();
  return <PopupForm record={record} />;
}
