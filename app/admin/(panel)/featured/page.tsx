import { FeaturedProductsManager } from "@/components/admin/featured-products-manager";
import { getFeaturedProducts } from "@/lib/admin/featured-data";

export default async function AdminFeaturedPage() {
  const featured = await getFeaturedProducts();
  return <FeaturedProductsManager initial={featured} />;
}
