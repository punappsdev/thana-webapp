import { notFound } from "next/navigation";
import { BannerForm } from "@/components/admin/banner-form";
import { getHomepageBannerRecord } from "@/lib/admin/banner-data";

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const record = await getHomepageBannerRecord(Number(id));
  if (!record) notFound();
  return <BannerForm record={record} />;
}
