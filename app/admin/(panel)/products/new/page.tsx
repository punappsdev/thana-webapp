import { ProductForm } from "@/components/admin/product-form";
import { getProductEditorOptions } from "@/lib/admin/product-data";
export default async function NewProductPage() { return <ProductForm record={null} options={await getProductEditorOptions()} />; }
