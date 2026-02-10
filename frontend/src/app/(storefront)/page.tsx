import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { getHomeData, getUnits } from "@/lib/api/storefront";
import type { ResolvedSection } from "@/lib/api/storefront";
import type { Unit } from "@/hooks/useUnit";
import T from "@/components/storefront/T";
import { getImageUrl } from "@/lib/media/getImageUrl";

import HeroSliderSection from "@/components/storefront/sections/HeroSliderSection";
import MarqueeBanner from "@/components/storefront/sections/MarqueeBanner";
import CategoryGridSection from "@/components/storefront/sections/CategoryGridSection";
import ProductCarouselSection from "@/components/storefront/sections/ProductCarouselSection";
import ProductTabsSection from "@/components/storefront/sections/ProductTabsSection";
import FullBannerSection from "@/components/storefront/sections/FullBannerSection";
import BannerGridSection from "@/components/storefront/sections/BannerGridSection";
import CountdownBannerSection from "@/components/storefront/sections/CountdownBannerSection";
import InfoCardsSection from "@/components/storefront/sections/InfoCardsSection";
import BrandLogosSection from "@/components/storefront/sections/BrandLogosSection";
import NewsletterSection from "@/components/storefront/sections/NewsletterSection";
import RichTextSection from "@/components/storefront/sections/RichTextSection";
import CollectionGridSection from "@/components/storefront/sections/CollectionGridSection";
import MultiImageGridSection from "@/components/storefront/sections/MultiImageGridSection";

export default async function StorefrontHome() {
    const [data, units] = await Promise.all([getHomeData(), getUnits()]);

    if (data.is_dynamic && 'sections' in data) {
        return (
            <div className="pb-20">
                {data.sections.map((section) => (
                    <DynamicSection key={section.id} section={section} units={units} />
                ))}
            </div>
        );
    }

    // Legacy static mode (fallback)
    const { categories, hero, new_arrivals } = data as any;
    return <LegacyHome categories={categories} hero={hero} new_arrivals={new_arrivals} />;
}

// ─── Dynamic Section Router ───

function DynamicSection({ section, units }: { section: ResolvedSection; units: Unit[] }) {
    const s = section.settings;
    const data = section.resolved_data || {};

    switch (section.key) {
        case "hero_slider":
            return <HeroSliderSection settings={s} />;
        case "marquee_banner":
            return <MarqueeBanner settings={s} />;
        case "category_grid":
            return <CategoryGridSection settings={s} categories={data.categories || []} />;
        case "product_carousel":
            return <ProductCarouselSection settings={s} products={data.products || []} units={units} />;
        case "product_tabs":
            return <ProductTabsSection settings={s} tabs={data.tabs || []} products={data.products || []} units={units} />;
        case "full_banner":
            return <FullBannerSection settings={s} />;
        case "banner_grid":
            return <BannerGridSection settings={s} />;
        case "collection_grid":
            return <CollectionGridSection settings={s} />;
        case "multi_image_grid":
            return <MultiImageGridSection settings={s} />;
        case "countdown_banner":
            return <CountdownBannerSection settings={s} />;
        case "info_cards":
            return <InfoCardsSection settings={s} />;
        case "brand_logos":
            return <BrandLogosSection settings={s} brands={data.brands || []} />;
        case "newsletter":
            return <NewsletterSection settings={s} />;
        case "rich_text":
            return <RichTextSection settings={s} />;
        default:
            return null;
    }
}

// ─── Legacy Static Home (backward compat) ───

function LegacyHome({ categories, hero, new_arrivals }: { categories: any[]; hero: any[]; new_arrivals: any[] }) {
    return (
        <div className="space-y-20 pb-20">
            {hero && hero.length > 0 && (
                <section className="relative h-[600px] w-full overflow-hidden z-0">
                    <div className="absolute inset-0">
                        <Image src={getImageUrl(hero[0].image)} alt={hero[0].title} fill className="object-cover" priority sizes="100vw" />
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative">
                            <div className="max-w-2xl space-y-6 text-white">
                                <h1 className="text-5xl md:text-7xl font-heading font-extrabold leading-tight">{hero[0].title}</h1>
                                <p className="text-xl md:text-2xl text-white/90">{hero[0].subtitle}</p>
                                <div className="pt-4">
                                    <Link href={hero[0].link} className="bg-primary hover:bg-white hover:text-primary text-white px-8 py-4 rounded-xl font-bold transition-all inline-flex items-center gap-2 group">
                                        {hero[0].button_text}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-heading font-bold"><T k="storefront.home.popular_categories" fallback="Popüler Kategoriler" /></h2>
                        <p className="text-gray-500 mt-2">Dilediğiniz kumaşı kategorisine göre bulun.</p>
                    </div>
                    <Link href="/kategoriler" className="text-primary font-bold flex items-center gap-1 hover:underline">
                        <T k="storefront.common.view_all" fallback="Tümünü Gör" /> <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {categories.map((cat: any) => (
                        <Link key={cat.id} href={`/kategoriler/${cat.slug}`} className="group space-y-3">
                            <div className="aspect-square relative rounded-2xl overflow-hidden bg-gray-100 border transition-transform group-hover:-translate-y-1">
                                <Image src={getImageUrl(cat.image)} alt={cat.name} fill className="object-cover transition-transform group-hover:scale-110" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw" />
                            </div>
                            <h3 className="font-bold text-center group-hover:text-primary transition-colors">{cat.name}</h3>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="bg-gray-50 py-20">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-heading font-bold text-secondary"><T k="storefront.home.new_arrivals" fallback="Yeni Gelenler" /></h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {new_arrivals.map((product: any) => (
                            <div key={product.id} className="bg-white rounded-2xl overflow-hidden border group hover:shadow-xl transition-all">
                                <div className="aspect-[4/5] relative bg-gray-100">
                                    {product.media?.[0] ? (
                                        <Image src={getImageUrl(product.media[0].path)} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">Görsel Yok</div>
                                    )}
                                </div>
                                <div className="p-5 space-y-2">
                                    <h3 className="font-bold truncate text-lg group-hover:text-primary transition-colors">
                                        <Link href={`/urun/${product.slug}`}>{product.name}</Link>
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-primary font-extrabold text-xl">{product.selling_price} ₺</span>
                                        {product.selling_price < product.price && (
                                            <span className="text-gray-400 line-through text-sm">{product.price} ₺</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
