"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useVariants } from "@/hooks/useVariants";
import { VariantEmptyState } from "./EmptyState";
import { VariantDrawer } from "./VariantDrawer";
import { VariantSection } from "./VariantSection";
import { VariantMediaDrawer } from "./VariantMediaDrawer";
import { Typography, Button, Space, Divider, Form, App, Modal, Input } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, DragOutlined, CopyOutlined } from "@ant-design/icons";
import { VariationValue } from "@/types/product";
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const { Text } = Typography;

const VARIANT_DEBUG = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_VARIANT_DEBUG === '1' || process.env.NEXT_PUBLIC_VARIANT_DEBUG === 'true');

function summarizeVariantArray(arr: any[] | undefined | null) {
    const list = Array.isArray(arr) ? arr : [];
    const emptyName = list.filter(v => !String(v?.name ?? '').trim()).length;
    const emptyUids = list.filter(v => !String(v?.uids ?? '').trim()).length;
    let emptyLabelCount = 0;
    let totalValueCount = 0;
    for (const v of list) {
        const vals = Array.isArray(v?.values) ? v.values : [];
        for (const val of vals) {
            totalValueCount += 1;
            const lbl = (val?.label ?? val?.name ?? val?.value ?? '').toString().trim();
            if (!lbl) emptyLabelCount += 1;
        }
    }
    const sample = list.slice(0, 5).map(v => ({
        uids: v?.uids,
        name: v?.name,
        values: Array.isArray(v?.values) ? v.values.map((x: any) => ({ valueId: x?.valueId ?? x?.id, label: x?.label })) : [],
    }));
    return {
        count: list.length,
        emptyName,
        emptyUids,
        totalValueCount,
        emptyLabelCount,
        sample,
    };
}

interface VariantManagerProps {
    form: any;
    unit?: any;
    mode?: "create" | "edit";
}

// Helper: Generate unique key WITHOUT Date.now() - deterministic
function generateUniqueKey(variant: any, index: number, prefix: string = 'variant'): string {
    // Handle undefined or null variant
    if (!variant) return `${prefix}-${index}`;
    
    if (variant.id) return String(variant.id);
    if (variant.uids) return variant.uids;
    if (variant.key) return variant.key;
    
    if (variant.values && Array.isArray(variant.values)) {
        const valueIds = variant.values.map((v: any) => v.id).filter(Boolean).join('-');
        if (valueIds) return `${prefix}-${valueIds}`;
    }
    
    return `${prefix}-${index}`;
}

// Sortable Variation Item
function SortableVariationItem({ variation, openEditVariationDrawer, removeVariation, openAddValueModal }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: variation.id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: 12,
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #E2E8F0",
        position: "relative" as const,
        zIndex: isDragging ? 999 : "auto"
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 12, flex: 1, alignItems: "flex-start" }}>
                    <div {...attributes} {...listeners} style={{ cursor: "grab", marginTop: 4, color: "#cbd5e1" }}>
                        <DragOutlined style={{ fontSize: 18 }} />
                    </div>

                    <div style={{ width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Text strong style={{ fontSize: 16 }}>{variation.name}</Text>
                            <span style={{
                                background: "#F1F5F9",
                                color: "#64748B",
                                fontSize: 11,
                                padding: "2px 6px",
                                borderRadius: 4,
                                textTransform: "uppercase",
                                fontWeight: 600
                            }}>
                                {variation.type}
                            </span>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                            {variation.values.map((val: any, valIdx: number) => (
                                <div key={`${variation.id}-val-${val.id ?? valIdx}-${valIdx}`} style={{
                                    border: "1px solid #E2E8F0",
                                    borderRadius: 6,
                                    padding: "4px 12px",
                                    fontSize: 14,
                                    color: "#334155",
                                    background: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6
                                }}>
                                    {val.label}
                                </div>
                            ))}
                            {!Boolean(variation.is_global) && (
                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={() => openAddValueModal(variation.id)}
                                    style={{ borderRadius: 6, height: 32, fontSize: 13 }}
                                >
                                    Değer Ekle
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 4 }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openEditVariationDrawer(variation.id)}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeVariation(variation.id)}
                    />
                </div>
            </div>
        </div>
    );
}

export function VariantManager({ form, unit, mode }: VariantManagerProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { message } = App.useApp();
    const {
        globalVariations,
        selectedVariations,
        generatedVariants,
        loading,
        lastError,
        setSelectedVariations
    } = useVariants(form);

    useEffect(() => {
        if (!Array.isArray(globalVariations) || globalVariations.length === 0) return;
        if (!Array.isArray(selectedVariations) || selectedVariations.length === 0) return;

        let changed = false;

        const next = selectedVariations.map((sv: any) => {
            const idStr = String(sv?.global_id ?? sv?.id ?? '');
            if (!idStr || !/^[0-9]+$/.test(idStr)) return sv;

            const gv = globalVariations.find((g: any) => String(g?.id) === idStr);
            if (!gv) return sv;

            const isUnknownType = !String(sv?.type ?? '').trim() || String(sv?.type ?? '').trim() === 'unknown';
            const isUnknownName = !String(sv?.name ?? '').trim() || /^Variation\s+\d+$/i.test(String(sv?.name ?? '').trim());

            if (!isUnknownType && !isUnknownName && sv?.is_global && String(sv?.global_id ?? '') === idStr) {
                return sv;
            }

            changed = true;
            return {
                ...sv,
                id: Number(gv.id),
                name: isUnknownName ? gv.name : sv.name,
                type: isUnknownType ? gv.type : sv.type,
                is_global: true,
                global_id: String(gv.id),
                // IMPORTANT: keep current sv.values (may be subset chosen by user)
                values: Array.isArray(sv?.values) ? sv.values : (Array.isArray(gv?.values) ? gv.values : []),
            };
        });

        if (!changed) return;

        setSelectedVariations(next as any);
        try {
            form.setFieldsValue({ variations: next });
        } catch {
            // ignore
        }
    }, [globalVariations, selectedVariations, setSelectedVariations, form]);

    const [editingVariation, setEditingVariation] = useState<any | null>(null);
    const [editingVariationId, setEditingVariationId] = useState<string | number | null>(null);
    const [newValue, setNewValue] = useState("");
    const [isValueModalOpen, setIsValueModalOpen] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);
    const [mediaVariantUids, setMediaVariantUids] = useState<string | null>(null);
    const [mediaVariant, setMediaVariant] = useState<any | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

    const tempVariationIdRef = useRef(0);
    const userTouchedRef = useRef(false);

    const lastAppliedVariantsJsonRef = useRef<string>("");
    const watchedVariants = Form.useWatch("variants", form);
    const watchedBasePrice = Form.useWatch("price", form);
    const watchedVariations = Form.useWatch("variations", form);
    const watchedDeletedVariantUids = Form.useWatch("deleted_variant_uids", form);

    const effectiveMode: "create" | "edit" = mode ?? "create";
    const isEditMode = effectiveMode === "edit";

    const handleRemoveVariation = (variationId: string | number) => {
        userTouchedRef.current = true;
        const next = (selectedVariations ?? []).filter((v: any) => String(v?.id) !== String(variationId));
        setSelectedVariations(next as any);

        // Defer form updates; calling setFieldsValue inside a state updater can trigger
        // React "Cannot update during an existing state transition".
        setTimeout(() => {
            try {
                if (next.length === 0) {
                    form.setFieldsValue({ variations: [], variants: [], deleted_variant_uids: [] });
                    setSelectedRowKeys([]);
                } else {
                    // Variations changed => uids space changes; clear previous deletions
                    form.setFieldsValue({ variations: next, deleted_variant_uids: [] });
                }
            } catch {
                // ignore
            }
        }, 0);
    };

    // Keep UI free of debug logs.

    // Cache initial API variants only when they have DB ids (prevents capturing generated variants before fetch finishes)
    const editModeVariantsRef = useRef<any[] | null>(null);
    useEffect(() => {
        if (!isEditMode) return;
        if (editModeVariantsRef.current !== null) return;
        const formVariants = form.getFieldValue('variants') ?? watchedVariants;
        if (!Array.isArray(formVariants) || formVariants.length === 0) return;
        if (!formVariants.some((v: any) => v?.id)) return;
        editModeVariantsRef.current = formVariants;
        if (!Array.isArray(watchedVariants) || watchedVariants.length === 0) {
            form.setFieldsValue({ variants: formVariants });
        }
    }, [form, watchedVariants, isEditMode]);

    // Merge Logic (create + edit): reconcile current variants with generated combinations.
    const mergedVariants = useMemo(() => {
        // Current variants always come from form store first (watch can lag in some cases).
        let currentVariants = (form.getFieldValue('variants') ?? watchedVariants ?? []) as any[];

        const deletedUidsRaw = watchedDeletedVariantUids ?? form.getFieldValue('deleted_variant_uids') ?? [];
        const deletedUidsSet = new Set<string>((Array.isArray(deletedUidsRaw) ? deletedUidsRaw : []).map((x: any) => String(x)));
        
        // If watchedVariants is empty but form might have data, read directly
        if (currentVariants.length === 0) {
            const formVariants = form.getFieldValue('variants');
            if (Array.isArray(formVariants) && formVariants.length > 0) {
                currentVariants = formVariants;
            }
        }
        
        const basePrice = watchedBasePrice ?? null;

        // Intentionally no console logging here.

        const valueLabelById = new Map<string, string>();
        (selectedVariations ?? []).forEach((vr: any) => {
            (vr?.values ?? []).forEach((vv: any) => {
                const id = vv?.id;
                const label = (vv?.label ?? vv?.name ?? vv?.value ?? null);
                if (id !== undefined && id !== null && label !== null && String(label).trim() !== '') {
                    valueLabelById.set(String(id), String(label));
                }
            });
        });

        const resolveVariantName = (variant: any, idx: number) => {
            const name = (variant?.name ? String(variant.name) : '').trim();
            if (name) return name;

            const valuesArr = variant?.values;
            if (Array.isArray(valuesArr) && valuesArr.length > 0) {
                const labels = valuesArr
                    .map((val: any) => {
                        if (!val) return null;
                        return (val.label ?? val.name ?? val.value ?? null);
                    })
                    .filter((x: any) => x !== null && String(x).trim() !== '')
                    .map((x: any) => String(x));
                if (labels.length > 0) return labels.join(' / ');
            }

            const uids = (variant?.uids ? String(variant.uids) : '').trim();
            if (uids) {
                const parts = uids.split('.').map((p) => p.trim()).filter(Boolean);
                const labels = parts.map((id) => valueLabelById.get(String(id))).filter(Boolean) as string[];
                if (labels.length > 0) return labels.join(' / ');
            }

            return 'Varyant';
        };

        const computeUidsFromValues = (vals: any): string => {
            if (!Array.isArray(vals)) return '';
            const ids = vals
                .map((x: any) => x?.valueId ?? x?.id ?? null)
                .filter((x: any) => x !== null && x !== undefined)
                .map((x: any) => String(x))
                .sort((a: string, b: string) => Number(a) - Number(b));
            return ids.join('.');
        };

        const identityOf = (v: any): string => {
            const u = (v?.uids ? String(v.uids) : '').trim();
            if (u) return u;
            const fromValues = computeUidsFromValues(v?.values);
            if (fromValues) return fromValues;
            const k = (v?.key ? String(v.key) : '').trim();
            return k;
        };

        const currentByUids = new Map<string, any>();
        currentVariants.filter(Boolean).forEach((v: any) => {
            const iden = identityOf(v);
            if (iden) currentByUids.set(iden, v);
        });

        // If no variations selected, clear all variants (don't keep current ones)
        if (!Array.isArray(selectedVariations) || selectedVariations.length === 0) {
            return [];
        }

        // Always start from generated variants and overlay existing edits by exact uids.
        const generated = (generatedVariants ?? []).filter(g => g != null).map((g: any, idx: number) => {
            const uniqueKey = generateUniqueKey(g, idx, 'generated-variant');

            const normalizedValues = Array.isArray(g?.values)
                ? g.values.map((val: any) => {
                    const valueId = val?.valueId ?? val?.id ?? null;
                    const label = (val?.label ?? val?.name ?? val?.value ?? null);
                    const mappedLabel = (valueId !== null && valueId !== undefined)
                        ? (valueLabelById.get(String(valueId)) ?? null)
                        : null;

                    return {
                        ...val,
                        valueId: val?.valueId ?? valueId,
                        id: val?.id ?? valueId,
                        label: (label && String(label).trim() !== '')
                            ? label
                            : (mappedLabel ?? label),
                    };
                })
                : [];

            const generatedUids = (g?.uids ? String(g.uids) : '').trim();
            const computedUids = computeUidsFromValues(g?.values);
            const uids = generatedUids || computedUids || undefined;

            const existing = uids ? currentByUids.get(String(uids)) : null;

            const merged = {
                ...g,
                ...(existing ?? {}),
                // Preserve DB identity only on exact uids match.
                id: existing?.id ?? undefined,
                key: existing?.key ?? uniqueKey,
                uids,
                // Always prefer generated values for correct labels / correct combinations
                values: normalizedValues,
            };

            const variantName = resolveVariantName(merged, idx);
            const resolvedQty = merged.qty ?? null;
            const allowBackorder = Boolean(merged.allow_backorder);

            return {
                ...merged,
                name: variantName,
                price: merged.price ?? null,
                discount_price: merged.discount_price ?? null,
                qty: resolvedQty,
                allow_backorder: allowBackorder,
                in_stock: allowBackorder || Number(resolvedQty ?? 0) > 0,
                is_active: (uids && deletedUidsSet.has(String(uids))) ? false : (merged.is_active ?? true),
                is_default: merged.is_default ?? false,
            };
        });

        // Ensure exactly one default: keep existing default if present, else first generated.
        const existingDefaultUids = (Array.isArray(currentVariants) ? currentVariants : []).find((v: any) => v?.is_default === true)?.uids;
        const all = generated.map((v: any, idx: number) => ({
            ...v,
            is_default: existingDefaultUids ? String(v?.uids ?? '') === String(existingDefaultUids) : idx === 0,
        }));

        // no debug logs

        return all;
    }, [generatedVariants, watchedBasePrice, selectedVariations, isEditMode, form, watchedVariants, watchedDeletedVariantUids]); // include form/watchedVariants due to edit-mode live fallback

    // Always keep form.variations in sync with UI state.
    // This is required so ProductPricingSection/ProductInventorySection can immediately hide base fields.
    useEffect(() => {
        // In edit mode, the form is hydrated asynchronously from the API.
        // Before initial restore happens, selectedVariations is empty. If we write to the form here,
        // we can accidentally wipe API-provided variations and trigger the "variants->variations" fallback,
        // resulting in placeholders like "Variation 6 / unknown" and jittery UI.
        if (isEditMode && !initialized && !userTouchedRef.current) {
            return;
        }

        const hasSelected = Array.isArray(selectedVariations) && selectedVariations.length > 0;

        // If user selects variations, consider the manager initialized so downstream sync logic can run.
        if (hasSelected && !initialized) {
            setInitialized(true);
        }
        try {
            if (!hasSelected) {
                // If user cleared all variations, reflect that in the form.
                // In edit mode we still only do this after user interaction or after initialization.
                form.setFieldsValue({ variations: [], variants: [] });
            } else {
                form.setFieldsValue({ variations: selectedVariations });
            }
        } catch {
            // ignore
        }
    }, [initialized, selectedVariations, form, isEditMode]);

    // no debug logs

    // Ensure single default
    const mergedVariantsWithDefault = useMemo(() => {
        if (!mergedVariants || mergedVariants.length === 0) return [];
        
        const defaultIndex = mergedVariants.findIndex((v: any) => v.is_default === true);
        const finalDefaultIndex = defaultIndex === -1 ? 0 : defaultIndex;
        
        return mergedVariants.map((v: any, i: number) => ({
            ...v,
            is_default: i === finalDefaultIndex
        }));
    }, [mergedVariants]);

    useEffect(() => {
        if (!isEditMode) return;
        if (!mergedVariantsWithDefault || mergedVariantsWithDefault.length === 0) return;
        const current = (form.getFieldValue('variants') ?? []) as any[];
        const missingKeyData = !Array.isArray(current) || current.length === 0 || current.some((v) =>
            !v?.uids || v?.price === undefined || v?.qty === undefined || v?.sku === undefined
        );
        if (!missingKeyData) return;
        form.setFieldsValue({ variants: mergedVariantsWithDefault.map((v: any, idx: number) => ({
            ...v,
            _tableIndex: v?._tableIndex ?? idx,
        })) });
    }, [isEditMode, mergedVariantsWithDefault, form]);

    useEffect(() => {
        if (!VARIANT_DEBUG) return;
        (window as any).__variantManager = {
            mode: effectiveMode,
            getSelectedVariations: () => selectedVariations,
            getGeneratedVariants: () => generatedVariants,
            getMergedVariants: () => mergedVariantsWithDefault,
        };
    }, [effectiveMode, selectedVariations, generatedVariants, mergedVariantsWithDefault]);

    // Initial Data Sync
    useEffect(() => {
        if (loading) return;
        if (!isEditMode && initialized) return;
        if (selectedVariations.length > 0) {
            if (!initialized) setInitialized(true);
            return;
        }

        // Once user interacts with the manager, never re-apply initial restore logic.
        if (userTouchedRef.current) return;

        const formVars = form.getFieldValue("variations");
        const formVariants = form.getFieldValue("variants");

        const initialVars = (Array.isArray(watchedVariations) && watchedVariations.length > 0) 
            ? watchedVariations 
            : (Array.isArray(formVars) && formVars.length > 0 ? formVars : []);
            
        const initialVariants = (Array.isArray(watchedVariants) && watchedVariants.length > 0)
            ? watchedVariants
            : (Array.isArray(formVariants) && formVariants.length > 0 ? formVariants : []);
        
        // If there is nothing to restore, exit.
        if ((!initialVars || initialVars.length === 0) && (!initialVariants || initialVariants.length === 0)) {
            return;
        }

        if (Array.isArray(initialVars) && initialVars.length > 0) {
            const synced = initialVars.map((iv: any) => {
                const global = globalVariations.find((gv: any) => String(gv.id) === String(iv.id));
                const values = (iv.values || []).map((v: any) => ({
                    id: v.id,
                    label: v.label,
                    color: v.color,
                    image: v.image,
                    position: v.position ?? 0
                }));

                return {
                    id: iv.id,
                    uid: iv.uid ?? String(iv.id),
                    name: iv.name,
                    type: iv.type,
                    position: iv.pivot?.position ?? iv.position ?? 0,
                    is_global: Boolean(global),
                    global_id: global ? String(global.id) : null,
                    values: values
                };
            });
            setSelectedVariations(synced);
            setInitialized(true);
        } else if (initialVariants && Array.isArray(initialVariants) && initialVariants.length > 0) {
            const variationMap = new Map();
            
            initialVariants.forEach((variant: any) => {
                if (variant.values && Array.isArray(variant.values)) {
                    variant.values.forEach((val: any) => {
                        const variationId = val.variationId ?? val.variation_id;
                        if (!variationId) return;
                        
                        if (!variationMap.has(variationId)) {
                            const global = globalVariations.find((gv: any) => String(gv.id) === String(variationId));
                            variationMap.set(variationId, {
                                id: variationId,
                                uid: global?.uid ?? String(variationId),
                                name: global?.name || `Variation ${variationId}`,
                                type: global?.type || 'unknown',
                                position: 0,
                                is_global: Boolean(global),
                                global_id: global ? String(global.id) : null,
                                values: []
                            });
                        }
                        
                        const variation = variationMap.get(variationId);
                        const valueId = val.valueId ?? val.value_id ?? val.id;
                        const existingValue = variation.values.find((v: any) => String(v.id) === String(valueId));
                        if (!existingValue) {
                            variation.values.push({
                                id: valueId,
                                label: val.label ?? val.name ?? val.value,
                                color: val.color,
                                image: val.image,
                                position: val.position ?? 0
                            });
                        }
                    });
                }
            });
            
            if (variationMap.size > 0) {
                setSelectedVariations(Array.from(variationMap.values()));
            }
            setInitialized(true);
        } else {
            // In edit mode, wait for product fetch to populate form before locking initialization.
            if (!isEditMode) setInitialized(true);
        }
    }, [form, initialized, globalVariations, setSelectedVariations, loading, isEditMode, watchedVariations, watchedVariants, selectedVariations.length]);

    // Sync Form: regenerate variants when selection changes (guarded in edit mode to avoid wiping API-loaded data).
    useEffect(() => {
        if (!initialized) return;
        
        const current = (form.getFieldValue('variants') ?? []) as any[];
        const currentUids = (Array.isArray(current) ? current : []).map((v: any) => String(v?.uids ?? ''));
        const nextUids = (mergedVariantsWithDefault ?? []).map((v: any) => String(v?.uids ?? ''));
        const uidsChanged = currentUids.join('|') !== nextUids.join('|');
        const lengthChanged = (Array.isArray(current) ? current.length : 0) !== (mergedVariantsWithDefault?.length ?? 0);

        const deletedUidsRaw = watchedDeletedVariantUids ?? form.getFieldValue('deleted_variant_uids') ?? [];
        const deletedSet = new Set<string>((Array.isArray(deletedUidsRaw) ? deletedUidsRaw : []).map((x: any) => String(x)));
        const deletionMismatch = (Array.isArray(current) ? current : []).some((v: any) => {
            const u = String(v?.uids ?? '').trim();
            if (!u) return false;
            const shouldBeDeleted = deletedSet.has(u);
            const isDeleted = v?.is_active === false || v?.is_active === 0;
            return shouldBeDeleted !== isDeleted;
        });

        const shouldApply = (lengthChanged || uidsChanged || deletionMismatch);

        if (shouldApply) {
            // Add _tableIndex to each variant for stable Table rowKey
            const variantsWithIndex = mergedVariantsWithDefault.map((v, idx) => ({
                ...v,
                _tableIndex: idx
            }));

            form.setFieldsValue({
                variations: selectedVariations,
                variants: variantsWithIndex,
            });

            setTimeout(() => {
                form.validateFields(['variants']).catch(() => {});
            }, 0);
        }
    }, [initialized, selectedVariations, mergedVariantsWithDefault, isEditMode, watchedDeletedVariantUids]);

    // Handlers
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            userTouchedRef.current = true;
            const oldIndex = selectedVariations.findIndex((v) => v.id === active.id);
            const newIndex = selectedVariations.findIndex((v) => v.id === over?.id);
            setSelectedVariations(arrayMove(selectedVariations, oldIndex, newIndex));
        }
    };

    const handleAddVariation = (values: any) => {
        userTouchedRef.current = true;
        if (typeof values?.separate_listing !== "undefined") {
            form.setFieldsValue({ separate_listing: values.separate_listing });
        }
        if (values?.id) {
            const updated = selectedVariations.map((v: any) => {
                if (String(v.id) !== String(values.id)) return v;

                return {
                    ...v,
                    name: values.name,
                    type: values.type,
                    values: v.is_global
                        ? v.values
                        : (values.values ?? []).map((val: any, i: number) => ({
                            id: val.id ?? `${values.id}-v-${i}`,
                            label: val.label,
                            color: val.color,
                            image: val.image,
                            position: i,
                        })),
                };
            });

            setSelectedVariations(updated as any);
            try {
                form.setFieldsValue({ variations: updated });
            } catch {
                // ignore
            }
            if (updated.length > 0 && !initialized) setInitialized(true);
            setEditingVariation(null);
            return;
        }

        const tempId = values?.is_global && values?.global_id
            ? values.global_id
            : `temp-${Date.now()}-${tempVariationIdRef.current++}`;

        // Prevent duplicate variation ids (breaks DnD + remove logic)
        const existingIndex = selectedVariations.findIndex((v: any) => String(v?.id) === String(tempId));

        const globalSource = values?.is_global && values?.global_id
            ? globalVariations.find((gv: any) => String(gv.id) === String(values.global_id))
            : null;

        const newVariation = {
            id: tempId,
            name: values.name,
            type: values.type,
            position: selectedVariations.length,
            is_global: Boolean(values?.is_global),
            global_id: values?.global_id ?? null,
            // IMPORTANT: In template/global mode, use values sent from drawer (filtered by user selection).
            // Do not import all globalSource values.
            values: (Boolean(values?.is_global) && Array.isArray(values?.values))
                ? (values.values ?? []).map((v: any, i: number) => ({
                    id: v.id,
                    label: v.label ?? v.name ?? v.value,
                    color: v.color,
                    image: v.image,
                    position: v.position ?? i,
                }))
                : (values.values ?? []).map((v: any, i: number) => ({
                    id: v.id ?? `${tempId}-v-${i}`,
                    label: v.label,
                    color: v.color,
                    image: v.image,
                    position: i,
                })) as VariationValue[],
        };

        const nextSelected = existingIndex >= 0
            ? selectedVariations.map((v: any, idx: number) => idx === existingIndex ? ({ ...v, ...newVariation }) : v)
            : [...selectedVariations, newVariation as any];
        setSelectedVariations(nextSelected);
        try {
            form.setFieldsValue({ variations: nextSelected });
        } catch {
            // ignore
        }
        if (nextSelected.length > 0 && !initialized) setInitialized(true);
    };

    const handleAddValue = () => {
        if (!newValue.trim() || !editingVariationId) return;

        const updatedVariations = selectedVariations.map(v => {
            if (v.id === editingVariationId) {
                return {
                    ...v,
                    values: [
                        ...v.values,
                        {
                            id: `temp-val-${v.values.length}`,
                            label: newValue,
                            position: v.values.length
                        }
                    ]
                };
            }
            return v;
        });

        setSelectedVariations(updatedVariations as any);
        setNewValue("");
        setIsValueModalOpen(false);
        setEditingVariationId(null);
    };

    const openAddValueModal = (variationId: string | number) => {
        const variation = selectedVariations.find((v: any) => String(v.id) === String(variationId));
        if ((variation as any)?.is_global) {
            message.warning("Global şema değerleri buradan eklenemez. Şema sayfasından ekleyin.");
            return;
        }
        setEditingVariationId(variationId);
        setIsValueModalOpen(true);
    };

    const openEditVariationDrawer = (variationId: string | number) => {
        const variation = selectedVariations.find((v: any) => String(v.id) === String(variationId));
        if (!variation) return;
        setEditingVariation(variation);
        setIsDrawerOpen(true);
    };

    const hasVariantsInForm = Array.isArray(watchedVariants) && watchedVariants.length > 0;

    if (selectedVariations.length === 0 && !hasVariantsInForm) {
        return (
            <>
                <VariantEmptyState onAdd={() => setIsDrawerOpen(true)} />
                <VariantDrawer
                    open={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    onSave={handleAddVariation}
                    initialValues={{ separate_listing: form.getFieldValue('separate_listing') }}
                />
            </>
        );
    }

    return (
        <div style={{ padding: "8px 0" }}>
            <div style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                marginBottom: 16,
            }}>
                <Button
                    icon={<PlusOutlined />}
                    onClick={() => setIsDrawerOpen(true)}
                    style={{
                        color: "#5E5CE6",
                        borderColor: "#5E5CE6",
                        fontWeight: 500,
                    }}
                >
                    Varyant Ekle
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={selectedVariations.map(v => v.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <Space direction="vertical" style={{ width: "100%" }} size="middle">
                        {selectedVariations.map((variation, varIdx) => (
                            <SortableVariationItem
                                key={`variation-${variation.id ?? varIdx}-${varIdx}`}
                                variation={variation}
                                openEditVariationDrawer={openEditVariationDrawer}
                                removeVariation={handleRemoveVariation}
                                openAddValueModal={openAddValueModal}
                            />
                        ))}
                    </Space>
                </SortableContext>
            </DndContext>

	            <div style={{ height: 16 }} />

            <div style={{ marginTop: 24 }}>
                <VariantSection
                    form={form}
                    unit={unit}
                    selectedRowKeys={selectedRowKeys}
                    onSelectedRowKeysChange={(keys) => setSelectedRowKeys(keys)}
                    onOpenMedia={(variant, uids) => {
                        setMediaVariant(variant);
                        setMediaVariantUids(uids);
                        setIsMediaDrawerOpen(true);
                    }}
                    setSelectedVariations={setSelectedVariations}
                />
            </div>

            <VariantDrawer
                open={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setEditingVariation(null);
                }}
                onSave={handleAddVariation}
                initialValues={{
                    ...(editingVariation ?? {}),
                    separate_listing: form.getFieldValue('separate_listing')
                }}
            />

            <VariantMediaDrawer
                open={isMediaDrawerOpen}
                onClose={() => {
                    setIsMediaDrawerOpen(false);
                    setMediaVariant(null);
                    setMediaVariantUids(null);
                }}
                variant={mediaVariant}
                variantUids={mediaVariantUids}
                form={form}
            />

            <Modal
                title="Yeni Değer Ekle"
                open={isValueModalOpen}
                onOk={handleAddValue}
                onCancel={() => setIsValueModalOpen(false)}
                okText="Ekle"
                cancelText="Vazgeç"
            >
                <Input
                    placeholder="Değer adı (Örn: XXL, Yeşil)"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onPressEnter={handleAddValue}
                />
            </Modal>
            <style jsx global>{`
                .row-default {
                  background-color: #fffaf0 !important;
                }
             `}</style>
        </div>
    );
}
