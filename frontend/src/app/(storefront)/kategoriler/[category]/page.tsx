import CategoryPageClient from "@/components/storefront/category/CategoryPageClient";
import { getCategoryData } from "@/lib/api/storefront";

interface Props {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  await getCategoryData(category).catch(() => null);
  return <CategoryPageClient categorySlug={category} />;
}
