"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { getImageUrl } from "@/lib/media/getImageUrl";
import ProductImageCarousel from "@/components/storefront/product/ProductImageCarousel";
import { useUnit } from "@/hooks/useUnit";
import type { Unit } from "@/hooks/useUnit";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

export interface RelatedProduct {
  id: number;
  slug: string;
  name: string;
  price?: number;
  selling_price?: number;
  discount_price?: number;
  unit_id?: number;
  unit?: Unit | unknown;
  media?: Array<{ url?: string; path?: string }>;
  base_image?: { url?: string; path?: string } | null;
  base_image_thumb?: { url?: string; path?: string } | null;
  variants?: Array<any>;
  defaultVariant?: { media?: Array<{ url?: string; path?: string }>; base_image?: { url?: string; path?: string } | null; base_image_thumb?: { url?: string; path?: string } | null };
  list_variants_separately?: boolean;
}

export interface RelatedProductsProps {
  related: RelatedProduct[];
  units?: Unit[];
}

// Tek ürün kartı bileşeni (ProductCard ile aynı mantık)
function RelatedProductCard({
  product,
  units = [],
}: {
  product: RelatedProduct;
  units: Unit[];
}) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [hoveredVariant, setHoveredVariant] = useState<any | null>(null);
  const [currentDisplayImage, setCurrentDisplayImage] = useState<string | null>(null);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  const selectedVariantUid = (selectedVariant as any)?.uid || (selectedVariant as any)?.uids || null;
  const basePath = `/urun/${product.slug}`;
  const href = selectedVariantUid
    ? `${basePath}?variant=${encodeURIComponent(String(selectedVariantUid))}`
    : basePath;

  const unitInput = (product as any)?.unit_id || (product as any)?.unit;
  const { formatPrice } = useUnit(unitInput, units);

  const variant = (product as any)?.variant ?? null;
  const variantName = (variant?.name ?? "").trim();
  const displayName = variantName ? `${product.name} - ${variantName}` : product.name;

  const basePrice = Number(variant?.price ?? (product as any)?.price ?? 0);
  const discountPrice = Number(variant?.discount_price ?? (product as any)?.discount_price ?? 0);
  const sellingPrice = Number((product as any)?.selling_price ?? basePrice ?? 0);
  const hasDiscount = discountPrice > 0 && basePrice > 0 && discountPrice < basePrice;
  const discountPercent = hasDiscount ? Math.round((1 - discountPrice / basePrice) * 100) : 0;

  const apiDefaultVariant = (product as any)?.defaultVariant ?? (product as any)?.default_variant ?? null;

  const variantBaseImage = (variant as any)?.base_image ?? null;
  const variantBaseImageThumb = (variant as any)?.base_image_thumb ?? null;
  const productBaseImage = (product as any)?.base_image ?? null;
  const productBaseImageThumb = (product as any)?.base_image_thumb ?? null;
  const defaultVariantBaseImage = (apiDefaultVariant as any)?.base_image ?? null;
  const defaultVariantBaseImageThumb = (apiDefaultVariant as any)?.base_image_thumb ?? null;

  const pickPath = (x: any): string | null => {
    if (!x) return null;
    if (typeof x === "string") return x;
    return x?.url || x?.path || null;
  };

  const listingMedia = (variant?.media && variant.media.length > 0)
    ? variant.media
    : (product.media && product.media.length > 0)
      ? product.media
      : ((apiDefaultVariant as any)?.media ?? []);

  const allVariants = useMemo(() => {
    const raw = (product as any)?.variants ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [product]);
  const showVariantThumbs = !(product as any)?.list_variants_separately && allVariants.length > 0;
  const activeVariants = showVariantThumbs
    ? allVariants.filter((v) => (v?.is_active ?? true) !== false)
    : [];
  const thumbVariants = activeVariants.slice(0, 3);

  // FleetCart tarzı varyant görseli çözümleme
  const resolveVariantImage = (v: any) => {
    const base =
      pickPath(v?.base_image_thumb) ||
      pickPath(v?.base_image) ||
      null;
    if (base) return getImageUrl(base);
    const media = Array.isArray(v?.media) ? v.media : [];
    const m = media[0]?.url || media[0]?.path || null;
    return m ? getImageUrl(m) : null;
  };

  // Görsel preload fonksiyonu
  const preloadImage = (src: string) => {
    if (!src || preloadedImages.has(src)) return;

    const img = new Image();
    img.onload = () => {
      setPreloadedImages((prev) => new Set(prev).add(src));
    };
    img.src = src;
  };

  // Aktif görseli belirle (hover > seçili > varsayılan)
  const currentVariant = hoveredVariant || selectedVariant;
  const selectedImage = previewImage
    || (currentVariant ? resolveVariantImage(currentVariant) : null)
    || null;

  // Varyant hover fonksiyonları
  const handleVariantHover = (variant: any) => {
    const img = resolveVariantImage(variant);
    if (img) {
      preloadImage(img);
      setHoveredVariant(variant);
      setTimeout(() => setPreviewImage(img), 50);
    }
  };

  const handleVariantLeave = () => {
    setHoveredVariant(null);
    setTimeout(() => setPreviewImage(null), 100);
  };

  const handleVariantClick = (variant: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(variant);
    setHoveredVariant(null);
  };

  // Yumuşak görsel geçişi için useEffect
  useEffect(() => {
    const targetImage = previewImage
      || (currentVariant ? resolveVariantImage(currentVariant) : null)
      || null;

    const timer = setTimeout(() => {
      setCurrentDisplayImage(targetImage);
    }, 100);

    return () => clearTimeout(timer);
  }, [previewImage, currentVariant]);

  // Tüm varyant görsellerini preload et
  useEffect(() => {
    if (showVariantThumbs && activeVariants.length > 0) {
      activeVariants.forEach((variant) => {
        const img = resolveVariantImage(variant);
        if (img) preloadImage(img);
      });
    }
  }, [showVariantThumbs, activeVariants]);

  const rawImages: Array<string | null | undefined> = [
    currentDisplayImage,
    pickPath(variantBaseImageThumb),
    pickPath(variantBaseImage),
    pickPath(defaultVariantBaseImageThumb),
    pickPath(defaultVariantBaseImage),
    pickPath(productBaseImageThumb),
    pickPath(productBaseImage),
    listingMedia?.[0]?.url,
    listingMedia?.[0]?.path,
    ...(listingMedia || []).slice(1).map((m: { url?: string; path?: string }) => m?.url || m?.path),
  ];

  const images = rawImages
    .filter(Boolean)
    .map((x) => getImageUrl(String(x)))
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .slice(0, 6);

  const fallback = getImageUrl(null);
  const finalImages = images.length ? images : [fallback];

  return (
    <Link href={href} className="group block">
      <div className="relative">
        {hasDiscount && discountPercent > 0 && (
          <div className="absolute top-2 left-2 z-10 flex h-11 w-11 flex-col items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
            <span className="text-[13px] font-semibold leading-none">-{discountPercent}%</span>
            <span className="text-[7px] font-semibold leading-none tracking-wide mt-0.5">İNDİRİM</span>
          </div>
        )}
        <ProductImageCarousel media={finalImages} alt={product.name} showArrows={false} showZoom={false} />
        {showVariantThumbs ? (
          <div className="mt-2 flex items-center gap-2">
            {thumbVariants.map((v: any) => {
              const img = resolveVariantImage(v) || getImageUrl(null);
              const vUid = v?.uid ?? v?.uids ?? null;
              const isActive = selectedVariant?.uid === vUid || selectedVariant?.uids === vUid;
              const isHovered = hoveredVariant?.uid === vUid || hoveredVariant?.uids === vUid;
              return (
                <button
                  key={String(v?.id ?? v?.uids ?? v?.name)}
                  type="button"
                  onMouseEnter={() => handleVariantHover(v)}
                  onMouseLeave={handleVariantLeave}
                  onClick={(e) => handleVariantClick(v, e)}
                  className={`h-11 w-11 rounded-xl border overflow-hidden bg-white ${
                    isActive
                      ? 'border-slate-900'
                      : isHovered
                        ? 'border-slate-400'
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                  aria-label={v?.name || "Varyant"}
                >
                  <img
                    src={img}
                    alt={v?.name || product.name}
                    className="h-full w-full object-cover"
                    onError={(ev) => {
                      const el = ev.currentTarget;
                      if (el && el.src !== window.location.origin + getImageUrl(null)) {
                        el.src = getImageUrl(null);
                      }
                    }}
                  />
                </button>
              );
            })}
            {activeVariants.length > 3 ? (
              <span className="text-xs text-gray-500">
                +{activeVariants.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-1">
        <h3 className="text-[13px] lg:text-[14px] text-gray-800 leading-tight line-clamp-2">
          {displayName}
        </h3>
        <div className="mt-1 min-h-[22px] lg:min-h-[24px] flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-[12px] lg:text-[13px] text-gray-400 line-through leading-none">
                {formatPrice(basePrice)}
              </span>
              <span className="text-[14px] lg:text-[15px] font-bold text-gray-900 leading-none">
                {formatPrice(discountPrice)}
              </span>
            </>
          ) : (
            <span className="text-[14px] lg:text-[15px] font-bold text-gray-900 leading-none">
              {formatPrice(sellingPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function RelatedProducts({ related, units = [] }: RelatedProductsProps) {
  if (!Array.isArray(related) || related.length === 0) return null;
  const items = related.slice(0, 12);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const canScrollLeft = Boolean(emblaApi?.canScrollPrev());
  const canScrollRight = Boolean(emblaApi?.canScrollNext());

  const scroll = (direction: "left" | "right") => {
    if (!emblaApi) return;
    if (direction === "left") emblaApi.scrollPrev();
    if (direction === "right") emblaApi.scrollNext();
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-10 border-t">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Benzer Ürünler</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
              canScrollLeft
                ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                : 'border-gray-200 opacity-40 cursor-not-allowed'
            }`}
            aria-label="Önceki ürünler"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
              canScrollRight
                ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                : 'border-gray-200 opacity-40 cursor-not-allowed'
            }`}
            aria-label="Sonraki ürünler"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div ref={emblaRef} className="overflow-hidden -mx-4 px-4">
        <div className="flex gap-4 pb-4">
          {items.map((product) => (
            <div
              key={String(product.id)}
              className="flex-[0_0_calc(50%-8px)] sm:flex-[0_0_calc(33.333%-11px)] md:flex-[0_0_calc(25%-12px)] lg:flex-[0_0_calc(20%-13px)] xl:flex-[0_0_calc(16.666%-14px)]"
            >
              <RelatedProductCard product={product} units={units} />
            </div>
          ))}
        </div>
      </div>

      {scrollSnaps.length > 1 && (canScrollLeft || canScrollRight) ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Sayfa ${i + 1}`}
              className={
                i === selectedIndex
                  ? "w-2 h-2 rounded-full bg-gray-900"
                  : "w-2 h-2 rounded-full bg-gray-300"
              }
              onClick={() => emblaApi?.scrollTo(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

