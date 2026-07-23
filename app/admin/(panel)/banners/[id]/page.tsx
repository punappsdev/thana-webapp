import { notFound } from "next/navigation";
import { BannerForm } from "@/components/admin/banner-form";
import { getBannerRecord, getPromotionOptions } from "@/lib/admin/banner-data";

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const record = await getBannerRecord(Number(id));
  if (!record) notFound();
  const promotions = record.type === "PROMOTION" ? await getPromotionOptions() : [];
  return <BannerForm type={record.type} record={record} promotions={promotions} />;
}
