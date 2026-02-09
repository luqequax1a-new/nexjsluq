"use client";

import { Drawer, Button, Space, InputNumber, Divider, Spin, App, Checkbox } from "antd";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";

type QuickEditType = "inventory" | "pricing";

interface QuickEditDrawersProps {
    productId: number | null;
    type: QuickEditType | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function QuickEditDrawers({ productId, type, onClose, onSuccess }: QuickEditDrawersProps) {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [formState, setFormState] = useState<any>({});

    useEffect(() => {
        if (productId && type) {
            void fetchProduct();
        } else {
            setProduct(null);
            setFormState({});
        }
    }, [productId, type]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const endpoint = type === "inventory"
                ? `/api/products/${productId}/inventory`
                : `/api/products/${productId}/pricing`;

            const res = await apiFetch<any>(endpoint, { method: "GET" });
            const p = res.product;
            setProduct(p);

            const initial: any = {
                price: p.price,
                discount_price: p.discount_price,
                qty: p.qty,
                allow_backorder: Boolean(p.allow_backorder),
                in_stock: p.in_stock,
                variants: {}
            };

            if (p.variants) {
                p.variants.forEach((v: any) => {
                    initial.variants[v.id] = {
                        price: v.price,
                        discount_price: v.discount_price,
                        qty: v.qty,
                        allow_backorder: Boolean(v.allow_backorder),
                        in_stock: v.in_stock,
                    };
                });
            }
            setFormState(initial);
        } catch (e: any) {
            message.error(t('admin.products.quick_edit.load_failed', 'Veriler yuklenemedi') + ": " + e.message);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const endpoint = type === "inventory"
                ? `/api/products/${productId}/inventory`
                : `/api/products/${productId}/pricing`;

            await apiFetch(endpoint, {
                method: "PATCH",
                json: formState
            });

            message.success(t('admin.products.quick_edit.save_success', 'Degisiklikler kaydedildi'));
            onSuccess();
            onClose();
        } catch (e: any) {
            message.error(t('admin.products.quick_edit.save_failed', 'Kaydetme basarisiz') + ": " + e.message);
        } finally {
            setSaving(false);
        }
    };

    function resolvePublicUrl(path: string): string {
        if (!path) return "";
        const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
        const normalized = path.startsWith("/") ? path.slice(1) : path;
        return `${base}/storage/${normalized}`;
    }

    const renderItem = (item: any, isVariant = false) => {
        const id = isVariant ? item.id : "main";
        const state = isVariant ? formState.variants?.[id] : formState;

        if (!state) return null;

        const updateState = (key: string, value: any) => {
            if (isVariant) {
                setFormState((prev: any) => ({
                    ...prev,
                    variants: {
                        ...prev.variants,
                        [id]: { ...prev.variants[id], [key]: value }
                    }
                }));
            } else {
                setFormState((prev: any) => ({ ...prev, [key]: value }));
            }
        };

        const mediaItem = isVariant
            ? (item.media?.[0] || product.media?.[0])
            : product.media?.[0];
        const thumbUrl = mediaItem ? resolvePublicUrl(mediaItem.thumb_path || mediaItem.path) : null;

        return (
            <div key={id} className="quick-edit-item" style={{
                padding: "16px",
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #f1f5f9",
                marginBottom: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0
                    }}>
                        {thumbUrl ? (
                            <img src={thumbUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <div style={{ color: "#cbd5e1", fontSize: 14 }}>+</div>
                        )}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px" }}>
                            {isVariant ? `${product.name} - ${item.name || item.values?.map((v: any) => v.label).join(' / ') || 'Varyant'}` : (item.name || product.name)}
                        </div>
                    </div>
                </div>

                <Divider style={{ margin: "4px 0" }} />

                {type === "pricing" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontWeight: 500 }}>{t('admin.products.quick_edit.price_label', 'Fiyat')}</div>
                            <Space.Compact style={{ width: "100%" }}>
                                <InputNumber
                                    style={{ width: "100%" }}
                                    value={state.price}
                                    onChange={(v) => updateState("price", v)}
                                    precision={2}
                                    size="large"
                                    prefix="?"
                                />
                                {product.unit?.price_prefix ? (
                                    <div style={{ padding: "0 10px", display: "flex", alignItems: "center", border: "1px solid #d9d9d9", borderLeft: 0, borderTopRightRadius: 8, borderBottomRightRadius: 8, background: "#fafafa", color: "#64748b", fontWeight: 600 }}>
                                        {product.unit.price_prefix}
                                    </div>
                                ) : null}
                            </Space.Compact>
                        </div>
                        <div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontWeight: 500 }}>{t('admin.products.quick_edit.discount_price_label', 'Indirimli Fiyat')}</div>
                            <Space.Compact style={{ width: "100%" }}>
                                <InputNumber
                                    style={{ width: "100%" }}
                                    value={state.discount_price}
                                    onChange={(v) => updateState("discount_price", v)}
                                    precision={2}
                                    size="large"
                                    prefix="?"
                                    placeholder={t('admin.products.quick_edit.no_discount', 'Indirim yok')}
                                />
                                {product.unit?.price_prefix ? (
                                    <div style={{ padding: "0 10px", display: "flex", alignItems: "center", border: "1px solid #d9d9d9", borderLeft: 0, borderTopRightRadius: 8, borderBottomRightRadius: 8, background: "#fafafa", color: "#64748b", fontWeight: 600 }}>
                                        {product.unit.price_prefix}
                                    </div>
                                ) : null}
                            </Space.Compact>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontWeight: 500 }}>{t('admin.products.quick_edit.qty_label', 'Miktar')}</div>
                        <Space.Compact style={{ width: "100%" }}>
                            <InputNumber
                                style={{ width: "100%" }}
                                value={state.qty}
                                onChange={(v) => {
                                    const allowBackorder = Boolean(state.allow_backorder);
                                    updateState("qty", v);
                                    updateState("in_stock", allowBackorder || Number(v ?? 0) > 0);
                                }}
                                size="large"
                                min={0}
                                step={product.unit?.is_decimal_stock ? (product.unit?.step || 0.1) : (product.unit?.step || 1)}
                                precision={product.unit?.is_decimal_stock ? 2 : 0}
                                controls={false}
                                decimalSeparator="."
                                onKeyDown={(e) => {
                                    const allowedKeys = ["Backspace", "Tab", "Enter", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
                                    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
                                    if (/^[0-9]$/.test(e.key)) return;
                                    if (
                                        product.unit?.is_decimal_stock
                                        && (
                                            e.key === "."
                                            || e.key === ","
                                            || e.key === "Decimal"
                                            || ("code" in e && (e as any).code === "NumpadDecimal")
                                        )
                                    ) {
                                        return;
                                    }
                                    e.preventDefault();
                                }}
                                parser={(value: any) => {
                                    if (!value) return "";
                                    const s = String(value).replace(/\s/g, "").replace(/,/g, ".");
                                    return s.replace(/[^0-9.\-]/g, "");
                                }}
                                formatter={(value: any) => (value === undefined || value === null ? "" : String(value))}
                            />
                            <div style={{ padding: "0 10px", display: "flex", alignItems: "center", border: "1px solid #d9d9d9", borderLeft: 0, borderTopRightRadius: 8, borderBottomRightRadius: 8, background: "#fafafa", color: "#64748b", fontWeight: 600 }}>
                                {product.unit?.stock_prefix || product.unit?.suffix || t('admin.product.form.unit.piece', 'adet')}
                            </div>
                        </Space.Compact>
                        <div style={{ marginTop: 10 }}>
                            <Checkbox
                                checked={Boolean(state.allow_backorder)}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    updateState("allow_backorder", checked);
                                    updateState("in_stock", checked || Number(state.qty ?? 0) > 0);
                                }}
                            >
                                {t('admin.product.form.inventory.allow_backorder', 'Stokta yokken satisa devam et')}
                            </Checkbox>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Drawer
            title={
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                        {type === "inventory" ? t('admin.products.quick_edit.inventory_title', 'Envanter Duzenle') : t('admin.products.quick_edit.pricing_title', 'Fiyat Duzenle')}
                    </span>
                    {product && <span style={{ fontSize: "13px", fontWeight: 400, color: "#64748b" }}>{product.name}</span>}
                </div>
            }
            placement="right"
            onClose={onClose}
            open={!!productId}
            width={400}
            extra={
                <Space>
                    <Button onClick={onClose}>{t('admin.common.cancel', 'Vazgec')}</Button>
                    <Button type="primary" onClick={handleSave} loading={saving} style={{ background: "#5E5CE6", borderColor: "#5E5CE6" }}>
                        {t('admin.common.save', 'Kaydet')}
                    </Button>
                </Space>
            }
            styles={{
                body: { background: "#f8fafc", padding: "16px" }
            }}
        >
            {loading ? (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Spin size="large" />
                </div>
            ) : product ? (
                <div className="quick-edit-scroll">
                    {product.variants && product.variants.length > 0 ? (
                        product.variants.map((v: any) => renderItem(v, true))
                    ) : (
                        renderItem(product, false)
                    )}
                </div>
            ) : null}

            <style jsx>{`
                .quick-edit-scroll {
                    height: 100%;
                    overflow-y: auto;
                }
            `}</style>
        </Drawer>
    );
}
