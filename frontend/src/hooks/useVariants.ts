import { useState, useMemo, useEffect } from "react";
import { Variation, ProductVariant } from "../types/product";
import { apiFetch } from "../lib/api";
import { App } from "antd";

const VARIANT_DEBUG = false; // Reduce console spam

export function useVariants(form: any) {
    const { message } = App.useApp();
    const [globalVariations, setGlobalVariations] = useState<Variation[]>([]);
    const [selectedVariations, setSelectedVariations] = useState<Variation[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastError, setLastError] = useState<any>(null);

    useEffect(() => {
        fetchGlobalVariations();
    }, []);

    const fetchGlobalVariations = async () => {
        try {
            setLoading(true);
            setLastError(null);
            
            const data = await apiFetch<Variation[]>("/api/variations");
            setGlobalVariations(data);
            
            if (VARIANT_DEBUG) {
                console.debug('[useVariants] /api/variations loaded', {
                    count: Array.isArray(data) ? data.length : 0,
                    sample: Array.isArray(data) ? data.slice(0, 3).map((v: any) => ({ id: v?.id, name: v?.name, type: v?.type, valuesCount: v?.values?.length ?? 0 })) : []
                });
            }
        } catch (e) {
            setLastError(e);
            console.error("Varyantlar yüklenirken hata oluştu", e);
            message.error("Varyant şemaları yüklenemedi (/api/variations). Yetki/oturum veya backend hatası olabilir.");
        } finally {
            setLoading(false);
        }
    };

    const addVariation = (variationId: number) => {
        const variation = globalVariations.find((v) => v.id === variationId);
        if (variation && !selectedVariations.find((v) => v.id === variation.id)) {
            setSelectedVariations([...selectedVariations, variation]);
        }
    };

    const removeVariation = (variationId: string | number) => {
        setSelectedVariations((prev) => (prev ?? []).filter((v) => String(v.id) !== String(variationId)));
    };

    const generatedVariants = useMemo(() => {
        if (selectedVariations.length === 0) return [];

        let combinations: any[][] = [[]];
        selectedVariations.forEach((variation) => {
            const nextCombinations: any[][] = [];
            combinations.forEach((combo) => {
                variation.values.forEach((value) => {
                    const label = (value as any)?.label || (value as any)?.name || (value as any)?.value || String(value.id);
                    // Use UID for FleetCart compatibility
                    const valueUid = (value as any)?.uid || String(value.id);
                    
                    nextCombinations.push([
                        ...combo,
                        {
                            variationId: variation.id,
                            variationUid: (variation as any)?.uid || String(variation.id),
                            valueId: value.id,
                            valueUid: valueUid,
                            label: label,
                            color: value.color || (value as any)?.value,
                            image: value.image,
                        },
                    ]);
                });
            });
            combinations = nextCombinations;
        });

        // If only one variation is selected, create single variants
        if (selectedVariations.length === 1) {
            return selectedVariations[0].values.map((value, index) => {
                const label = (value as any)?.label || (value as any)?.name || (value as any)?.value || String(value.id);
                const valueUid = (value as any)?.uid || String(value.id);
                
                return {
                    key: valueUid,
                    name: label,
                    values: [{
                        variationId: selectedVariations[0].id,
                        variationUid: (selectedVariations[0] as any)?.uid || String(selectedVariations[0].id),
                        valueId: value.id,
                        valueUid: valueUid,
                        label: label,
                        color: value.color || (value as any)?.value,
                        image: value.image,
                    }],
                    uids: valueUid, // Use UID for FleetCart compatibility
                    sku: "",
                    price: null,
                    qty: null,
                    is_active: true,
                    is_default: index === 0,
                };
            });
        }

        return combinations.map((combo, index) => {
            // Build uids using variation value UIDs (FleetCart style)
            const uids = combo
                .map((c) => String(c.valueUid))
                .sort()
                .join(".");

            const nameParts = combo
                .map((c) => {
                    const label = c?.label || c?.name || c?.value || '';
                    return String(label).trim();
                })
                .filter((s) => s !== '' && s !== '/' && s !== null && s !== undefined);

            const variantName = nameParts.length > 0 ? nameParts.join(" / ") : `Variant ${index + 1}`;

            return {
                key: uids,
                name: variantName,
                values: combo,
                uids,
                sku: "",
                price: null,
                qty: null,
                is_active: true,
                is_default: index === 0,
            };
        });
    }, [selectedVariations]);

    useEffect(() => {
        if (!VARIANT_DEBUG) return;
        console.debug('[useVariants] state', {
            globalVariations: globalVariations.length,
            selectedVariations: selectedVariations.length,
            generatedVariants: generatedVariants.length,
            loading,
            hasError: !!lastError,
        });
    }, [globalVariations.length, selectedVariations.length, generatedVariants.length, loading, lastError]);


    return {
        globalVariations,
        selectedVariations,
        generatedVariants,
        loading,
        lastError,
        addVariation,
        removeVariation,
        setSelectedVariations
    };
}
