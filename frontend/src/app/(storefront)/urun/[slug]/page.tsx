import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import { getProductData, getUnits } from "@/lib/api/storefront";
import type { ApiError } from "@/lib/api";
import { getImageUrl } from "@/lib/media/getImageUrl";

import ProductDetail from "@/components/storefront/product/ProductDetail";
import { RelatedProducts } from "@/components/storefront/product/RelatedProducts";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";

interface Props {
    params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function getProductImage(product: any): string {
    const path =
        product?.base_image?.path ||
        product?.base_image_thumb?.path ||
        product?.defaultVariant?.base_image?.path ||
        product?.media?.[0]?.path ||
        product?.media?.[0]?.url ||
        null;
    return getImageUrl(path);
}

function getProductImages(product: any): string[] {
    const images: string[] = [];
    const media = Array.isArray(product?.media) ? product.media : [];
    for (const m of media.slice(0, 6)) {
        const p = m?.path || m?.url;
        if (p) images.push(getImageUrl(p));
    }
    if (images.length === 0) {
        const main = getProductImage(product);
        if (main) images.push(main);
    }
    return images;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    try {
        const data: any = await getProductData(slug);
        const { product } = data as any;

        const title = product.meta_title || product.name;
        const description = product.meta_description || product.short_description || "";
        const images = getProductImages(product);
        const canonical = `${SITE_URL}/urun/${product.slug}`;
        const price = Number(product.selling_price || product.price || 0);

        return {
            title,
            description,
            robots: {
                index: true,
                follow: true,
                'max-image-preview': 'large' as const,
                'max-snippet': -1,
            },
            alternates: {
                canonical,
            },
            openGraph: {
                type: "website",
                url: canonical,
                title,
                description,
                siteName: "FabricMarket",
                images: images.map((url) => ({ url, width: 800, height: 800, alt: title })),
                locale: "tr_TR",
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: images.slice(0, 1),
            },
            other: {
                ...(price > 0 ? { 'product:price:amount': price.toFixed(2) } : {}),
                'product:price:currency': 'TRY',
                'product:availability': product.in_stock !== false ? 'in stock' : 'out of stock',
            },
        };
    } catch {
        return {
            title: "Ürün Bulunamadı",
        };
    }
}

export default async function ProductPage({ params }: Props) {
    const { slug } = await params;

    try {
        const [data, units] = await Promise.all([
            getProductData(slug),
            getUnits(),
        ]);
        const { product, related } = data as any;

        return (
            <>
                <ProductJsonLd product={product} />
                <ProductDetail product={product} />
                <RelatedProducts related={related || []} units={units || []} />
            </>
        );
    } catch (error) {
        const e = error as Partial<ApiError> | any;
        if (e && typeof e === "object" && Number(e.status) === 404) {
            return notFound();
        }

        const msg = (e && typeof e === "object" && typeof e.message === "string")
            ? e.message
            : "Ürün verisi alınamadı.";

        return (
            <div className="container mx-auto px-4 py-10">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">{msg}</div>
            </div>
        );
    }
}
