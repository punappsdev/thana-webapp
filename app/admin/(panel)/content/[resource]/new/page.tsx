import { notFound } from "next/navigation";
import { ContentForm } from "@/components/admin/content-form";
import { contentConfigs, isContentResource } from "@/lib/admin/content-config";
import { getContentCategoryOptions } from "@/lib/admin/content-data";

export default async function NewContentPage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!isContentResource(resource)) notFound();
  const config = contentConfigs[resource];
  return <ContentForm config={config} record={null} categories={await getContentCategoryOptions(config.categoryKind)} />;
}
