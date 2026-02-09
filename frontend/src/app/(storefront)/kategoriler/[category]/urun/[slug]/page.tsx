import { redirect } from "next/navigation";

import { getProductData, getUnits } from "@/lib/api/storefront";
import ProductDetail from "@/components/storefront/product/ProductDetail";
import { RelatedProducts } from "@/components/storefront/product/RelatedProducts";

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export default async function CategoryProductPage({ params }: Props) {
  const { slug } = await params;

  try {
    const [data, units] = await Promise.all([
      getProductData(slug),
      getUnits(),
    ]);
    const { product, related } = data as any;

    return (
      <>
        <ProductDetail product={product} />
        <RelatedProducts related={related || []} units={units || []} />
      </>
    );
  } catch {
    return redirect("/urun/" + slug);
  }
}
