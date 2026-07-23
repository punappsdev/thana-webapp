import { BannerForm } from "@/components/admin/banner-form";
import { getPromotionOptions } from "@/lib/admin/banner-data";

export default async function NewBannerPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const bannerType = type === "promotion" ? "PROMOTION" : "HOMEPAGE";
  const promotions = bannerType === "PROMOTION" ? await getPromotionOptions() : [];
  return <BannerForm type={bannerType} record={null} promotions={promotions} />;
}
