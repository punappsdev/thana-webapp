import { notFound } from "next/navigation";
import { ContentForm } from "@/components/admin/content-form";
import { contentConfigs, isContentResource } from "@/lib/admin/content-config";
import { getContentCategoryOptions, getContentRecord } from "@/lib/admin/content-data";

export default async function EditContentPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  if (!isContentResource(resource) || !/^\d+$/.test(id)) notFound();
  const config = contentConfigs[resource];
  const [record, categories] = await Promise.all([getContentRecord(resource, Number(id)), getContentCategoryOptions(config.categoryKind)]);
  if (!record) notFound();
  return <ContentForm config={config} record={record} categories={categories} />;
}
