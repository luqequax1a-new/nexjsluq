"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Product, ProductVariant } from "@/types/storefront";
import { cn } from "@/lib/utils";
import ProductImageCarousel from "./ProductImageCarousel";
import { getImageUrl } from "@/lib/media/getImageUrl";
import { ProductTabs } from "./ProductTabs";
import { ProductVariationOptions } from "./ProductVariationOptions";
import { ProductExtraOptions } from "./ProductExtraOptions";
import { ProductQuantityAndAddToCart } from "./ProductQuantityAndAddToCart";
import { useStorefrontSettings } from "@/context/StorefrontSettingsContext";
import { useCart } from "@/context/CartContext";

interface ProductDetailProps {
    product: Product;
}

function slugify(input: any): string {
    try {
        if (input === null || input === undefined) return "";
        let str = String(input).trim().toLowerCase();
        str = str
            .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
            .replace(/ı/g, "i").replace(/i̇/g, "i").replace(/ö/g, "o").replace(/ç/g, "c");
        try { str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch {}
        return str.replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    } catch { return ""; }
}

export default function ProductDetail({ product }: ProductDetailProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { settings } = useStorefrontSettings();
    const { checkOffers } = useCart();
    const showStockQty = settings.storefront_show_stock_quantity === '1' || settings.storefront_show_stock_quantity === 'true';
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const unit: any = (product as any)?.unit ?? null;
    const unitName = String((unit as any)?.name || "").trim();
    const unitLabel = String((unit as any)?.label || "").trim();
    const unitQtyPrefix = String((unit as any)?.quantity_prefix || "").trim();
    const unitSuffix = String((unit as any)?.suffix || (unit as any)?.stock_prefix || "").trim();
    const displayChipSuffix = unitQtyPrefix || "";
    const [quantity, setQuantity] = useState<number>(() => {
        const dq = Number(unit?.default_qty ?? 1);
        return Number.isFinite(dq) && dq > 0 ? dq : 1;
    });
    const [isEditingQty, setIsEditingQty] = useState(false);
    const [qtyInput, setQtyInput] = useState<string>("");
    const [selectedVariationOptions, setSelectedVariationOptions] = useState<Record<number, number>>({});
    const [selectedExtraOptions, setSelectedExtraOptions] = useState<Record<number, number>>({});

    const variations: any[] = Array.isArray((product as any)?.variations) ? (product as any).variations : [];
    const shouldUseVariations = variations.length > 0;



    const attributes: any[] = Array.isArray((product as any)?.attributes) ? (product as any).attributes : [];
    const hasAttributes = attributes.length > 0;

    const attributeGroups = useMemo(() => {
        const groups = new Map<string, any[]>();

        attributes.forEach((a: any) => {
            const groupName = String(a?.attribute_set || 'Özellikler').trim() || 'Özellikler';
            if (!groups.has(groupName)) {
                groups.set(groupName, []);
            }
            groups.get(groupName)!.push(a);
        });

        return Array.from(groups.entries());
    }, [attributes]);


    // Update URL with readable variant query params (replaceState, no reload)
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (!selectedVariant || !shouldUseVariations || typeof window === "undefined") return;

        try {
            const url = new URL(window.location.href);

            // Remove old variant/variation params
            url.searchParams.delete("variant");
            variations.forEach((vr: any) => {
                const key = slugify(vr?.name);
                if (key) url.searchParams.delete(key);
            });

            // Build readable params from selected variant values
            const variantValues = Array.isArray((selectedVariant as any)?.values) ? (selectedVariant as any).values : [];
            const valueToVariationMap = new Map<number, any>();
            variations.forEach((vr: any) => {
                const vals = Array.isArray(vr?.values) ? vr.values : [];
                vals.forEach((v: any) => {
                    valueToVariationMap.set(Number(v?.id), { variation: vr, value: v });
                });
            });

            variantValues.forEach((v: any) => {
                const valueId = Number(v?.valueId ?? v?.id);
                const info = valueToVariationMap.get(valueId);
                if (!info) return;
                const key = slugify(info.variation?.name);
                const val = slugify(info.value?.label);
                if (key && val) url.searchParams.set(key, val);
            });

            window.history.replaceState({}, "", url.toString());
        } catch {}
    }, [selectedVariant]);

    // Initialize selections
    useEffect(() => {
        if (product.variants.length > 0) {
            const variantParam = (searchParams.get("variant") || "").trim();

            // Strategy 1: ?variant=uid
            const fromQuery = variantParam
                ? product.variants.find((v: any) =>
                    String((v as any)?.uid ?? (v as any)?.uids ?? v?.id ?? "") === variantParam
                )
                : null;

            // Strategy 2: Readable query params (?renk=kirmizi&beden=xl)
            let fromReadableParams: any = null;
            if (!fromQuery && variations.length > 0) {
                const matchedValueIds: number[] = [];
                let hasAnyParam = false;
                for (const vr of variations) {
                    const key = slugify(vr?.name);
                    const raw = searchParams.get(key);
                    if (!raw) continue;
                    hasAnyParam = true;
                    const valueSlug = slugify(raw);
                    const vals = Array.isArray(vr?.values) ? vr.values : [];
                    const matched = vals.find((v: any) => slugify(v?.label) === valueSlug);
                    if (matched) matchedValueIds.push(Number(matched.id));
                }
                if (hasAnyParam && matchedValueIds.length > 0) {
                    const sortedIds = [...matchedValueIds].sort((a, b) => a - b);
                    const targetUids = sortedIds.join(".");
                    fromReadableParams = product.variants.find((variant: any) => {
                        // Match by uids field (numeric value IDs joined with dots)
                        const variantUids = String(variant?.uids ?? "").split(".").map(Number).sort((a: number, b: number) => a - b).join(".");
                        if (variantUids === targetUids) return true;
                        // Fallback: match by values array
                        const vals2 = Array.isArray(variant?.values) ? variant.values : [];
                        const ids = vals2.map((x: any) => Number(x?.valueId ?? x?.id ?? 0)).filter((n: number) => n > 0).sort((a: number, b: number) => a - b).join(".");
                        return ids === targetUids;
                    });
                }
            }

            const defaultVar = fromQuery || fromReadableParams || product.variants.find(v => v.is_default) || product.variants[0];
            setSelectedVariant(defaultVar);

            // Map option values for the default variant
            const initialOptions: Record<number, number> = {};
            if (shouldUseVariations) {
                // Build valueId -> variationId lookup from variations data (more reliable)
                const valueToVariationMap = new Map<number, number>();
                variations.forEach((vr: any) => {
                    const vrId = Number(vr?.id);
                    const vals = Array.isArray(vr?.values) ? vr.values : [];
                    vals.forEach((v: any) => {
                        const vid = Number(v?.id);
                        if (Number.isFinite(vid) && vid > 0 && Number.isFinite(vrId) && vrId > 0) {
                            valueToVariationMap.set(vid, vrId);
                        }
                    });
                });

                const vals = Array.isArray((defaultVar as any)?.values) ? (defaultVar as any).values : [];
                vals.forEach((x: any) => {
                    const valueId = Number(x?.valueId ?? x?.id ?? 0);
                    if (!Number.isFinite(valueId) || valueId <= 0) return;
                    // Use our lookup map to find the correct variation ID
                    const variationId = valueToVariationMap.get(valueId) ?? Number(x?.variation_id ?? x?.variationId ?? 0);
                    if (!Number.isFinite(variationId) || variationId <= 0) return;
                    initialOptions[variationId] = valueId;
                });

                // Fill in any missing variations with their first value
                variations.forEach((vr: any) => {
                    const vid = Number(vr?.id);
                    if (!Number.isFinite(vid) || vid <= 0) return;
                    if (Number.isFinite(Number(initialOptions[vid])) && Number(initialOptions[vid]) > 0) return;
                    const values = Array.isArray(vr?.values) ? vr.values : [];
                    const first = values.find((z: any) => Number.isFinite(Number(z?.id)) && Number(z?.id) > 0);
                    if (first?.id) {
                        initialOptions[vid] = Number(first.id);
                    }
                });
            } else {
                // Legacy: handle old optionValues format if present
                const optionVals = (defaultVar as any)?.optionValues ?? [];
                optionVals.forEach((ov: any) => {
                    const parentOption = product.options.find(o => o.values.some(v => v.id === ov.id));
                    if (parentOption) {
                        initialOptions[parentOption.id] = ov.id;
                    }
                });
            }
            setSelectedVariationOptions(initialOptions);

            if (shouldUseVariations) {
                const selectedValueIds = Object.values(initialOptions)
                    .map((x) => Number(x))
                    .filter((n) => Number.isFinite(n) && n > 0);
                const targetUids = normalizeUids(selectedValueIds.join("."));
                const match = product.variants.find((variant: any) => {
                    const u = normalizeUids(variant?.uid ?? variant?.uids ?? "");
                    if (u && targetUids) return u === targetUids;

                    const vals2 = Array.isArray(variant?.values) ? variant.values : [];
                    const ids = vals2
                        .map((x: any) => Number(x?.valueId ?? x?.id ?? 0))
                        .filter((n: number) => Number.isFinite(n) && n > 0);
                    return normalizeUids(ids.join(".")) === targetUids;
                });
                if (match) {
                    setSelectedVariant(match);
                }
            }

            const extra: Record<number, number> = {};
            (Array.isArray((product as any)?.options) ? (product as any).options : []).forEach((o: any) => {
                const first = Array.isArray(o?.values) ? o.values[0] : null;
                if (o?.id && first?.id) {
                    extra[Number(o.id)] = Number(first.id);
                }
            });
            setSelectedExtraOptions(extra);
        }
    }, [product, searchParams]);

    // Check for product detail offers
    useEffect(() => {
        if (product?.id) {
            checkOffers('product_page', product.id);
        }
    }, [product?.id]);

    useEffect(() => {
        const dq = Number((product as any)?.unit?.default_qty ?? 1);
        setQuantity(Number.isFinite(dq) && dq > 0 ? dq : 1);
    }, [product]);

    const rawDecimal = (unit as any)?.is_decimal_stock;
    const isDecimalAllowed = rawDecimal === true
        || rawDecimal === 1
        || String(rawDecimal).toLowerCase() === 'true'
        || String(rawDecimal).toLowerCase() === '1';
    const precision = isDecimalAllowed ? 2 : 0;
    const minQty = Number.isFinite(Number(unit?.min)) ? Number(unit.min) : 1;
    const maxQty = unit?.max !== null && unit?.max !== undefined && unit?.max !== ""
        ? Number(unit.max)
        : null;
    const stepQtyRaw = Number(unit?.step ?? (isDecimalAllowed ? 0.1 : 1));
    const stepQty = Number.isFinite(stepQtyRaw) && stepQtyRaw > 0 ? stepQtyRaw : (isDecimalAllowed ? 0.1 : 1);

    const roundQty = (v: number) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return minQty;
        const clampedMin = Math.max(minQty, n);
        const clamped = maxQty !== null && Number.isFinite(maxQty) ? Math.min(maxQty, clampedMin) : clampedMin;
        if (precision === 0) return Math.round(clamped);
        return Number(clamped.toFixed(precision));
    };

    const alignToStep = (v: number) => {
        const base = Number.isFinite(minQty) ? minQty : 0;
        const steps = Math.round((v - base) / stepQty);
        return base + steps * stepQty;
    };

    // FleetCart behavior:
    // - +/- buttons and chips follow step rounding
    // - manual input does NOT round to step, only clamps + precision
    const normalizeQtyStep = (v: number) => {
        const aligned = alignToStep(v);
        return roundQty(aligned);
    };

    const normalizeQtyManual = (v: number) => {
        return roundQty(v);
    };

    const incrementQty = () => setQuantity((q) => normalizeQtyStep(Number(q) + stepQty));
    const decrementQty = () => setQuantity((q) => normalizeQtyStep(Number(q) - stepQty));

    const parseQtyInput = (raw: string) => {
        const s = String(raw || "").replace(",", ".").trim();
        const n = Number(s);
        if (!Number.isFinite(n)) return null;
        return n;
    };

    const sanitizeQtyInput = (raw: string) => {
        const s = String(raw || "");
        // Allow digits, comma, dot. FleetCart-like permissive input.
        return s.replace(/[^0-9,\.]/g, "");
    };

    const beginEditQty = () => {
        setIsEditingQty(true);
        setQtyInput("");
    };

    const cancelEditQty = () => {
        setIsEditingQty(false);
        setQtyInput("");
    };

    const commitEditQty = () => {
        const raw = String(qtyInput || "").trim();
        if (!raw) {
            cancelEditQty();
            return;
        }

        const n = parseQtyInput(raw);
        if (n === null) {
            cancelEditQty();
            return;
        }

        setQuantity(normalizeQtyManual(n));
        setIsEditingQty(false);
        setQtyInput("");
    };

    const formatQtyForOverlay = (qty: number) => {
        if (isDecimalAllowed) {
            const fixed = Number(qty).toFixed(2);
            return fixed.replace(/\.00$/, "");
        }
        return String(Math.round(Number(qty)));
    };

    const showDecimalQuantityCard = Boolean(isDecimalAllowed && product.in_stock);
    const chips = [0.5, 1, 2.5, 5, 10];

    const resolveGalleryMedia = (): any[] => {
        const v: any = selectedVariant as any;
        const varMedia = Array.isArray(v?.media) ? v.media : [];
        if (varMedia.length > 0) return varMedia;

        const base = v?.base_image_thumb?.url || v?.base_image_thumb?.path || v?.base_image?.url || v?.base_image?.path || null;
        if (base) {
            return [{ id: `variant-base-${String(v?.id ?? "x")}`, url: base, path: base }];
        }

        const prodMedia = Array.isArray((product as any)?.media) ? (product as any).media : [];
        return prodMedia;
    };

    // Memoize gallery media to update when selectedVariant changes
    const galleryMedia = useMemo(() => {
        const media = resolveGalleryMedia();
        return media.length > 0 ? media : [getImageUrl(null)];
    }, [selectedVariant, product]);

    // FleetCart-compatible: Normalize UIDs (handles both numeric IDs and string UIDs)
    const normalizeUids = (raw: any): string => {
        const s = String(raw ?? "").trim();
        if (!s) return "";
        const parts = s
            .split(/[\.,\s]+/)
            .map((x) => x.trim())
            .filter(Boolean);

        // Sort numerically if all parts are numeric, otherwise string sort
        const allNumeric = parts.every((p) => /^\d+$/.test(p));
        if (allNumeric) {
            parts.sort((a, b) => Number(a) - Number(b));
        } else {
            parts.sort();
        }
        return parts.join(".");
    };

    const findMatchingVariant = (selectedMap: Record<number, number>) => {
        // Get variation IDs to filter - only use variations, not options
        const variationIds = new Set(variations.map((vr: any) => Number(vr?.id)).filter((n) => Number.isFinite(n) && n > 0));

        // Get selected value IDs - ONLY for variations, not options
        const selectedValueIds = Object.entries(selectedMap)
            .filter(([key]) => variationIds.has(Number(key)))
            .map(([, value]) => Number(value))
            .filter((n) => Number.isFinite(n) && n > 0);

        if (selectedValueIds.length === 0) return null;

        const variantsList: any[] = Array.isArray((product as any)?.variants) ? (product as any).variants : [];

        // Strategy 1: Match by variant.values array (most reliable)
        let match = variantsList.find((variant: any) => {
            const variantValues = Array.isArray(variant?.values) ? variant.values : [];
            const variantValueIds = variantValues
                .map((v: any) => Number(v?.valueId ?? v?.id ?? 0))
                .filter((n: number) => Number.isFinite(n) && n > 0);

            if (variantValueIds.length !== selectedValueIds.length) return false;

            const sortedVariant = [...variantValueIds].sort((a, b) => a - b);
            const sortedSelected = [...selectedValueIds].sort((a, b) => a - b);

            return sortedVariant.every((id, idx) => id === sortedSelected[idx]);
        });

        if (match) return match;

        // Strategy 2: Match by uids string (numeric value IDs joined with dots)
        const sortedIds = [...selectedValueIds].sort((a, b) => a - b);
        const selectedIdsNormalized = sortedIds.join(".");

        match = variantsList.find((variant: any) => {
            const variantUids = normalizeUids(variant?.uids ?? "");
            return variantUids === selectedIdsNormalized;
        });

        if (match) return match;

        // Strategy 3: Match by uid-based lookup (FleetCart string UIDs)
        const valueUidMap = new Map<number, string>();
        variations.forEach((vr: any) => {
            const values = Array.isArray(vr?.values) ? vr.values : [];
            values.forEach((val: any) => {
                const valId = Number(val?.id);
                const valUid = String(val?.uid ?? valId);
                if (Number.isFinite(valId) && valId > 0) {
                    valueUidMap.set(valId, valUid);
                }
            });
        });

        const selectedUidParts = selectedValueIds
            .map((id) => valueUidMap.get(id) || String(id));
        const allNumeric = selectedUidParts.every((p) => /^\d+$/.test(p));
        if (allNumeric) {
            selectedUidParts.sort((a, b) => Number(a) - Number(b));
        } else {
            selectedUidParts.sort();
        }
        const selectedUidsNormalized = selectedUidParts.join(".");

        match = variantsList.find((variant: any) => {
            const variantUids = normalizeUids(variant?.uids ?? variant?.uid ?? "");
            return variantUids === selectedUidsNormalized;
        });

        if (match) return match;

        return null;
    };

    const handleOptionSelect = (optionId: number, valueId: number) => {
        const newOptions = { ...selectedVariationOptions, [optionId]: valueId };
        setSelectedVariationOptions(newOptions);

        if (shouldUseVariations) {
            const match = findMatchingVariant(newOptions);
            if (match) {
                setSelectedVariant(match);
            } else {
                // No variant exists for this combination — clear to prevent stale data
                setSelectedVariant(null);
            }
        }
    };

    // Sync selectedVariationOptions when selectedVariant changes
    useEffect(() => {
        if (!selectedVariant || !shouldUseVariations) return;

        const variantValues = Array.isArray((selectedVariant as any)?.values) ? (selectedVariant as any).values : [];
        if (variantValues.length === 0) return;

        // Build valueId -> variationId lookup from variations data (more reliable than stale variationId in variant.values)
        const valueToVariationMap = new Map<number, number>();
        variations.forEach((vr: any) => {
            const vrId = Number(vr?.id);
            const vals = Array.isArray(vr?.values) ? vr.values : [];
            vals.forEach((v: any) => {
                const vid = Number(v?.id);
                if (Number.isFinite(vid) && vid > 0 && Number.isFinite(vrId) && vrId > 0) {
                    valueToVariationMap.set(vid, vrId);
                }
            });
        });

        const newOptions: Record<number, number> = {};
        variantValues.forEach((v: any) => {
            const valueId = Number(v?.valueId ?? v?.id);
            if (!Number.isFinite(valueId) || valueId <= 0) return;
            // Use lookup map to find correct variation ID
            const variationId = valueToVariationMap.get(valueId) ?? Number(v?.variationId ?? v?.variation_id ?? 0);
            if (Number.isFinite(variationId) && variationId > 0) {
                newOptions[variationId] = valueId;
            }
        });

        // Only update if different
        const currentKeys = Object.keys(selectedVariationOptions).sort().join(',');
        const newKeys = Object.keys(newOptions).sort().join(',');
        const currentVals = Object.values(selectedVariationOptions).sort().join(',');
        const newVals = Object.values(newOptions).sort().join(',');

        if (currentKeys !== newKeys || currentVals !== newVals) {
            setSelectedVariationOptions(newOptions);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVariant, shouldUseVariations, variations.length]);

    useEffect(() => {
        if (!shouldUseVariations) return;
        if (variations.length === 0) return;

        const allChosen = variations.every((vr: any) => {
            const vid = Number(vr?.id);
            const chosen = Number(selectedVariationOptions[vid]);
            return Number.isFinite(vid) && vid > 0 && Number.isFinite(chosen) && chosen > 0;
        });
        if (!allChosen) return;

        const match = findMatchingVariant(selectedVariationOptions);
        if (match && (!selectedVariant || (selectedVariant as any)?.id !== (match as any)?.id)) {
            setSelectedVariant(match);
        }
    }, [selectedVariationOptions, shouldUseVariations, variations.length, product]);

    const handleExtraOptionSelect = (optionId: number, valueId: number) => {
        setSelectedExtraOptions((prev) => ({ ...(prev ?? {}), [optionId]: valueId }));
    };

    const currentPrice = selectedVariant?.selling_price || product.selling_price;
    const oldPrice = selectedVariant?.price || product.price;
    const isDiscounted = currentPrice < oldPrice;
    const discountPercent = isDiscounted && oldPrice > 0 ? Math.round((1 - currentPrice / oldPrice) * 100) : 0;
    const priceFormat = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

    const showVariantInTitle = shouldUseVariations && !!selectedVariant;
    const variantDisplayName = (selectedVariant as any)?.name || (selectedVariant as any)?.variant_name || '';
    const descriptionHtml = String(
        (product as any)?.description ??
        (product as any)?.full_description ??
        (product as any)?.fullDescription ??
        (product as any)?.short_description ??
        ''
    ).trim();

    return (
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-primary">Anasayfa</Link>
                <span>/</span>
                {product.categories && product.categories.length > 0 ? (
                    <>
                        <Link href={`/kategoriler/${product.categories[0].slug}`} className="hover:text-primary font-medium">
                            {product.categories[0].name}
                        </Link>
                        <span>/</span>
                    </>
                ) : null}
                <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16">
                {/* Left: Gallery */}
                <div>
                    <ProductImageCarousel media={galleryMedia} alt={product.name} />
                </div>

                {/* Right: Info */}
                <div className="space-y-8 lg:sticky lg:top-[140px] lg:self-start">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-3">
                            {product.name}
                            {showVariantInTitle ? (
                                <>
                                    {" "}
                                    - <span>{variantDisplayName}</span>
                                </>
                            ) : null}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>Kod: <span className="text-gray-900 font-medium">{selectedVariant?.sku || product.sku}</span></span>
                            {product.brand && (
                                <span>Marka: <Link href={`/markalar/${product.brand.slug}`} className="text-primary hover:underline">{product.brand.name}</Link></span>
                            )}
                            {(() => {
                                const sv = selectedVariant as any;
                                const variantInStock = sv
                                    ? (sv.in_stock ?? (Number(sv.qty ?? 0) > 0 || sv.allow_backorder))
                                    : product.in_stock;
                                const stockQty = sv ? Number(sv.qty ?? 0) : Number((product as any).qty ?? 0);
                                const allowBackorder = sv ? Boolean(sv.allow_backorder) : Boolean((product as any).allow_backorder);

                                if (!variantInStock) {
                                    return <span className="text-red-500">Tükendi</span>;
                                }

                                if (showStockQty && !allowBackorder && Number.isFinite(stockQty) && stockQty > 0) {
                                    const stockSuffix = unitSuffix || unitLabel || 'Adet';
                                    const formattedQty = isDecimalAllowed
                                        ? stockQty.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                        : Math.floor(stockQty).toLocaleString('tr-TR');
                                    return (
                                        <span className="text-emerald-600 font-medium">
                                            Stok: {formattedQty} {stockSuffix}
                                        </span>
                                    );
                                }

                                return <span className="text-emerald-600">Stokta</span>;
                            })()}
                        </div>

                        {String((product as any)?.short_description ?? '').trim() && (
                            <div
                                className="mt-4 prose prose-sm text-gray-600 leading-relaxed max-w-none"
                                dangerouslySetInnerHTML={{ __html: String((product as any).short_description) }}
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-4 pb-6 border-b">
                        {isDiscounted && discountPercent > 0 && (
                            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-red-600 text-white shadow-sm flex-shrink-0">
                                <span className="text-sm font-bold leading-none">%{discountPercent}</span>
                            </div>
                        )}
                        <div className="flex flex-col gap-1">
                            {isDiscounted && (
                                <div className="text-base text-gray-400 line-through">
                                    {priceFormat(oldPrice)}
                                </div>
                            )}
                            <div className={cn("text-3xl font-extrabold", isDiscounted ? "text-red-600" : "text-gray-900")}>
                                {priceFormat(currentPrice)}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Options */}
                        {shouldUseVariations ? (
                            <ProductVariationOptions
                                product={product}
                                variations={variations}
                                selectedVariationOptions={selectedVariationOptions}
                                onSelect={handleOptionSelect}
                            />
                        ) : null}

                        <ProductExtraOptions
                            options={Array.isArray((product as any)?.options) ? (product as any).options : []}
                            selectedExtraOptions={selectedExtraOptions}
                            onSelect={handleExtraOptionSelect}
                        />

                        {/* Quantity and Add to Cart */}
                        <ProductQuantityAndAddToCart
                            showDecimalQuantityCard={showDecimalQuantityCard}
                            unitLabel={unitLabel}
                            unitName={unitName}
                            unit={unit}
                            quantity={quantity}
                            setQuantity={setQuantity}
                            isDecimalAllowed={isDecimalAllowed}
                            isEditingQty={isEditingQty}
                            qtyInput={qtyInput}
                            setQtyInput={setQtyInput}
                            minQty={minQty}
                            maxQty={maxQty}
                            stepQty={stepQty}
                            chips={chips}
                            displayChipSuffix={displayChipSuffix}
                            normalizeQtyStep={normalizeQtyStep}
                            parseQtyInput={parseQtyInput}
                            sanitizeQtyInput={sanitizeQtyInput}
                            formatQtyForOverlay={formatQtyForOverlay}
                            beginEditQty={beginEditQty}
                            cancelEditQty={cancelEditQty}
                            commitEditQty={commitEditQty}
                            incrementQty={incrementQty}
                            decrementQty={decrementQty}
                            product={product}
                            selectedVariant={selectedVariant}
                            selectedExtraOptions={selectedExtraOptions}
                        />
                    </div>

                </div>
            </div>

            {/* Bottom: Tabs (Full Width) */}
            <div className="mt-10 lg:mt-14">
                <ProductTabs
                    description={descriptionHtml}
                    attributeGroups={attributeGroups}
                    customTabs={(product as any)?.custom_tabs ?? []}
                />
            </div>

        </div>
    );
}
