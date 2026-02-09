import { getImageUrl } from "@/lib/media/getImageUrl";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function resolveImage(product: any): string {
    const path =
        product?.base_image?.path ||
        product?.base_image_thumb?.path ||
        product?.defaultVariant?.base_image?.path ||
        product?.media?.[0]?.path ||
        product?.media?.[0]?.url ||
        null;
    return getImageUrl(path);
}

function resolveImages(product: any): string[] {
    const images: string[] = [];
    const media = Array.isArray(product?.media) ? product.media : [];
    for (const m of media.slice(0, 6)) {
        const p = m?.path || m?.url;
        if (p) images.push(getImageUrl(p));
    }
    if (images.length === 0) {
        images.push(resolveImage(product));
    }
    return [...new Set(images)];
}

function buildBreadcrumb(product: any) {
    const items: any[] = [
        {
            "@type": "ListItem",
            position: 1,
            name: "Ana Sayfa",
            item: SITE_URL,
        },
    ];

    const categories = product?.categories || [];
    let pos = 2;
    for (const cat of categories.slice(0, 3)) {
        items.push({
            "@type": "ListItem",
            position: pos++,
            name: cat.name,
            item: `${SITE_URL}/kategoriler/${cat.slug}`,
        });
    }

    items.push({
        "@type": "ListItem",
        position: pos,
        name: product.name,
        item: `${SITE_URL}/urun/${product.slug}`,
    });

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items,
    };
}

function buildProductSchema(product: any) {
    const images = resolveImages(product);
    const url = `${SITE_URL}/urun/${product.slug}`;

    const sellingPrice = Number(product.selling_price || product.price || 0);
    const regularPrice = Number(product.price || 0);
    const discountPrice = Number(product.discount_price || 0);
    const finalPrice = discountPrice > 0 && discountPrice < regularPrice ? discountPrice : sellingPrice;

    const description = (product.short_description || product.description || product.name || "")
        .replace(/<[^>]*>/g, "")
        .slice(0, 300);

    const schema: any = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description,
        image: images.length === 1 ? images[0] : images,
        url,
        sku: product.sku || String(product.id),
        mpn: product.sku || String(product.id),
        itemCondition: "https://schema.org/NewCondition",
    };

    // Brand
    const brandName = product?.brand?.name;
    if (brandName) {
        schema.brand = { "@type": "Brand", name: brandName };
    }

    // Category path
    const categories = product?.categories || [];
    if (categories.length > 0) {
        schema.category = categories.map((c: any) => c.name).join(" > ");
    }

    // GTIN
    if (product.gtin) {
        schema.gtin13 = product.gtin;
    }

    // Offers
    const variants = product?.variants || [];
    const activeVariants = variants.filter((v: any) => v.is_active !== false);

    if (activeVariants.length > 1) {
        const prices = activeVariants
            .map((v: any) => Number(v.selling_price || v.price || 0))
            .filter((p: number) => p > 0);

        if (prices.length > 0) {
            schema.offers = {
                "@type": "AggregateOffer",
                lowPrice: Math.min(...prices).toFixed(2),
                highPrice: Math.max(...prices).toFixed(2),
                offerCount: prices.length,
                priceCurrency: "TRY",
                url,
            };
        }
    } else {
        const inStock = product.in_stock !== false && (product.qty === undefined || product.qty > 0);
        schema.offers = {
            "@type": "Offer",
            price: finalPrice.toFixed(2),
            priceCurrency: "TRY",
            availability: inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url,
            itemCondition: "https://schema.org/NewCondition",
        };

        // priceValidUntil (indirim varsa)
        if (product.special_price_end) {
            schema.offers.priceValidUntil = product.special_price_end.split("T")[0];
        }
    }

    return schema;
}

export function ProductJsonLd({ product }: { product: any }) {
    if (!product) return null;

    const productSchema = buildProductSchema(product);
    const breadcrumbSchema = buildBreadcrumb(product);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
        </>
    );
}
