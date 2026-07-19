import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getProductEditorOptions, getProductEditorRecord } from "@/lib/admin/product-data";
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; if (!/^\d+$/.test(id)) notFound(); const [record, options] = await Promise.all([getProductEditorRecord(Number(id)), getProductEditorOptions()]); if (!record) notFound(); return <ProductForm record={record} options={options} />; }
