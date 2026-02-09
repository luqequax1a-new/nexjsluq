"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    Card,
    Typography,
    Row,
    Col,
    Tag,
    Button,
    Space,
    Table,
    Timeline,
    Select,
    Input,
    Divider,
    App,
    Avatar,
    Image,
    Spin,
    Modal,
    Alert,
    Steps,
} from "antd";
import {
    ArrowLeftOutlined,
    PrinterOutlined,
    EditOutlined,
    SaveOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    ShoppingOutlined,
    CarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    SyncOutlined,
    HomeOutlined,
    DollarOutlined,
    FileTextOutlined,
    HistoryOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import { usePageHeader } from "@/hooks/usePageHeader";
import type { Order, OrderOptions, OrderStatus, PaymentStatus, OrderItem } from "@/types/order";

const { TextArea } = Input;

const normalizeOptionLabels = (options: any): string[] => {
    if (!options) return [];
    if (Array.isArray(options)) {
        return options
            .map((opt: any) => {
                if (opt == null) return "";
                if (typeof opt === "string" || typeof opt === "number") return String(opt);
                const name = opt?.name || opt?.variation_name || opt?.variation || opt?.label || "";
                const val =
                    opt?.value ??
                    opt?.label ??
                    opt?.name ??
                    (Array.isArray(opt?.values) ? opt.values.join(", ") : "");
                if (name && val && name !== val) return `${name}: ${val}`;
                return val || name || "";
            })
            .filter(Boolean);
    }
    if (typeof options === "object") {
        return Object.entries(options)
            .map(([key, value]) => {
                if (value == null) return "";
                const isNumericKey = /^[0-9]+$/.test(String(key));
                if (typeof value === "object") {
                    const val = (value as any)?.label ?? (value as any)?.value ?? (value as any)?.name ?? "";
                    if (!val) return "";
                    return isNumericKey ? String(val) : `${key}: ${val}`;
                }
                return isNumericKey ? String(value) : `${key}: ${value}`;
            })
            .filter(Boolean);
    }
    return [String(options)];
};

const formatQty = (val: unknown, unit?: any) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return "0";
    const useDecimals = Boolean(unit?.is_decimal_stock);
    const s = n.toFixed(useDecimals ? 3 : 0);
    return s.replace(/\.?0+$/, "");
};

const getUnitPrefix = (unit?: any, fallbackLabel?: string) => {
    const stockPrefix = String(unit?.stock_prefix ?? "").trim();
    const quantityPrefix = String(unit?.quantity_prefix ?? "").trim();
    const suffix = String(unit?.suffix ?? "").trim();
    return stockPrefix || quantityPrefix || suffix || (fallbackLabel ? String(fallbackLabel) : "");
};

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;
    const { message } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [options, setOptions] = useState<OrderOptions | null>(null);

    // Edit states
    const [editingStatus, setEditingStatus] = useState(false);
    const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
    const [editingPayment, setEditingPayment] = useState(false);
    const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus | "">("");
    const [editingTracking, setEditingTracking] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [carrier, setCarrier] = useState("");
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [noteText, setNoteText] = useState("");

    // Load options
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const opts = await apiFetch<OrderOptions>("/api/orders/options");
                setOptions(opts);
            } catch (e) {
                console.error("Failed to load options", e);
            }
        };
        loadOptions();
    }, []);

    // Load order
    const loadOrder = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch<Order>(`/api/orders/${orderId}`);
            setOrder(data);
            setTrackingNumber(data.shipping_tracking_number || "");
            setCarrier(data.shipping_carrier || "");
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : t("admin.orders.detail.load_failed", "Sipariş yüklenemedi");
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [orderId, message]);

    useEffect(() => {
        if (orderId) loadOrder();
    }, [orderId, loadOrder]);

    // Global Header - Extra buttons
    const headerExtra = useMemo(() => (
        <Space size={12}>
            <Button icon={<PrinterOutlined />} style={{ borderRadius: 8 }}>
                {t("admin.common.print", "Yazdır")}
            </Button>
            <Button icon={<FileTextOutlined />} style={{ borderRadius: 8 }}>
                {t("admin.orders.invoice", "Fatura")}
            </Button>
        </Space>
    ), []);

    // Set global header
    usePageHeader({
        title: order?.order_number || t("admin.orders.detail.loading", "Yükleniyor..."),
        extra: headerExtra,
        onBack: () => router.push("/admin/orders"),
    });

    // Update order
    const updateOrder = async (data: Partial<Order>) => {
        setSaving(true);
        try {
            await apiFetch(`/api/orders/${orderId}`, {
                method: "PUT",
                json: data,
            });
            message.success(t("admin.orders.detail.update_success", "Sipariş güncellendi"));
            await loadOrder();
            setEditingStatus(false);
            setEditingPayment(false);
            setEditingTracking(false);
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : t("admin.orders.detail.update_failed", "Güncelleme başarısız");
            message.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // Add note
    const addNote = async () => {
        if (!noteText.trim()) return;
        setSaving(true);
        try {
            await apiFetch(`/api/orders/${orderId}/note`, {
                method: "POST",
                json: { note: noteText, type: "admin" },
            });
            message.success(t("admin.orders.detail.note_added", "Not eklendi"));
            await loadOrder();
            setNoteModalOpen(false);
            setNoteText("");
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : t("admin.orders.detail.note_failed", "Not eklenemedi");
            message.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!order) {
        return (
            <Alert
                message={t("admin.orders.detail.not_found", "Sipariş Bulunamadı")}
                description={t("admin.orders.detail.not_found_desc", "İstenen sipariş bulunamadı veya silinmiş.")}
                type="error"
                showIcon
                action={<Button onClick={() => router.push("/admin/orders")}>{t("admin.common.go_back", "Geri Dön")}</Button>}
            />
        );
    }

    const paymentFee = Number(order.payment_fee ?? 0);
    const currency = order.currency_code || "TRY";
    const formatMoney = (value: number) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(Number(value) || 0);

    const isSameAddress = (() => {
        if (!order.billing_address || !order.shipping_address) return false;
        const keys = [
            "first_name",
            "last_name",
            "company",
            "phone",
            "email",
            "tax_number",
            "tax_office",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
        ];
        return keys.every((key) => {
            const a = String((order.billing_address as any)[key] ?? "").trim();
            const b = String((order.shipping_address as any)[key] ?? "").trim();
            return a === b;
        });
    })();

    // Status colors
    const statusColors: Record<OrderStatus, string> = {
        pending: "#f59e0b",
        confirmed: "#3b82f6",
        processing: "#8b5cf6",
        shipped: "#06b6d4",
        delivered: "#10b981",
        cancelled: "#ef4444",
        refunded: "#6b7280",
    };

    // Status step
    const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];
    const currentStep = statusSteps.indexOf(order.status);

    // Items table columns
    const itemColumns = [
        {
            title: t("admin.orders.items.product", "Ürün"),
            key: "product",
            render: (_: unknown, item: OrderItem) => (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {item.image ? (
                        <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${item.image}`}
                            alt={item.name}
                            width={48}
                            height={48}
                            style={{ borderRadius: 8, objectFit: "cover" }}
                            fallback="/placeholder.png"
                        />
                    ) : (
                        <div style={{ width: 48, height: 48, background: "#f3f4f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ShoppingOutlined style={{ color: "#9ca3af" }} />
                        </div>
                    )}
                    <div>
                        <Typography.Text strong>{item.name}</Typography.Text>
                        {item.sku && <div style={{ fontSize: 12, color: "#6b7280" }}>SKU: {item.sku}</div>}
                        {item.options && Object.keys(item.options).length > 0 && (
                            <div style={{ marginTop: 4 }}>
                                {normalizeOptionLabels(item.options).map((label) => (
                                    <Tag key={label} style={{ marginRight: 4, fontSize: 11 }}>{label}</Tag>
                                ))}
                            </div>
                        )}
                        {(item as any).offer_data?.offer_name && (
                            <div style={{ marginTop: 4 }}>
                                <Tag color="orange" style={{ fontSize: 11 }}>
                                    🏷️ {(item as any).offer_data.offer_name}
                                </Tag>
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: t("admin.orders.items.unit_price", "Birim Fiyat"),
            dataIndex: "unit_price",
            align: "right" as const,
            width: 120,
            render: (v: number) => formatMoney(v),
        },
        {
            title: t("admin.orders.items.quantity", "Miktar"),
            key: "quantity",
            align: "center" as const,
            width: 100,
            render: (_: unknown, item: OrderItem) => {
                const unitPrefix = getUnitPrefix(item.product?.unit, item.unit_label);
                const qty = formatQty(item.quantity, item.product?.unit);
                return unitPrefix ? `${qty} ${unitPrefix}` : qty;
            },
        },
        {
            title: t("admin.orders.items.tax", "KDV"),
            dataIndex: "tax_amount",
            align: "right" as const,
            width: 100,
            render: (v: number, item: OrderItem) => `${formatMoney(v)} (%${item.tax_rate})`,
        },
        {
            title: t("admin.orders.items.total", "Toplam"),
            dataIndex: "line_total",
            align: "right" as const,
            width: 120,
            render: (v: number) => <Typography.Text strong style={{ color: "#10b981" }}>{formatMoney(v)}</Typography.Text>,
        },
    ];

    return (
        <>
            {/* Order Info Header */}
            <Card size="small" style={{ borderRadius: 12, border: "1px solid #f0f0f5", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <Typography.Text type="secondary">
                            {dayjs(order.created_at).format("DD MMMM YYYY, HH:mm")} • {order.source === "admin" ? "Admin" : "Web"}
                        </Typography.Text>
                    </div>
                </div>
            </Card>

            {/* Status Steps */}
            {!["cancelled", "refunded"].includes(order.status) && (
                <Card size="small" style={{ borderRadius: 12, border: "1px solid #f0f0f5", marginBottom: 24 }}>
                    <Steps
                        current={currentStep}
                        size="small"
                        items={[
                            { title: t("admin.orders.status.pending", "Beklemede"), icon: <ClockCircleOutlined /> },
                            { title: t("admin.orders.status.confirmed", "Onaylandı"), icon: <CheckCircleOutlined /> },
                            { title: t("admin.orders.status.processing", "Hazırlanıyor"), icon: <SyncOutlined /> },
                            { title: t("admin.orders.status.shipped", "Kargoda"), icon: <CarOutlined /> },
                            { title: t("admin.orders.status.delivered", "Teslim Edildi"), icon: <HomeOutlined /> },
                        ]}
                    />
                </Card>
            )}

            <Row gutter={24}>
                {/* Left Column - Order Details */}
                <Col span={16}>
                    {/* Order Items */}
                    <Card
                        title={<Space><ShoppingOutlined /> {t("admin.orders.order_items", "Sipariş Kalemleri")} ({order.items?.length || 0})</Space>}
                        size="small"
                        style={{ borderRadius: 12, border: "1px solid #f0f0f5", marginBottom: 24 }}
                    >
                        <Table
                            dataSource={order.items || []}
                            columns={itemColumns}
                            rowKey="id"
                            pagination={false}
                            size="small"
                        />

                        {/* Totals */}
                        <Divider style={{ margin: "16px 0" }} />
                        <Row justify="end">
                            <Col span={8}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span>{t("admin.orders.subtotal", "Ara Toplam")}:</span>
                                    <span>{formatMoney(order.subtotal)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span>{t("admin.orders.tax", "KDV")}:</span>
                                    <span>{formatMoney(order.tax_total)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span>{t("admin.orders.shipping", "Kargo")}:</span>
                                    <span>{formatMoney(order.shipping_total)}</span>
                                </div>
                                {paymentFee !== 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span>{t("admin.orders.payment_fee", "Ödeme Ücreti")}:</span>
                                        <span>
                                            {paymentFee < 0 ? "-" : ""}
                                            {formatMoney(Math.abs(paymentFee))}
                                        </span>
                                    </div>
                                )}
                                {order.discount_total > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#ef4444" }}>
                                        <span>{t("admin.orders.discount", "İndirim")}:</span>
                                        <span>-{formatMoney(order.discount_total)}</span>
                                    </div>
                                )}
                                <Divider style={{ margin: "8px 0" }} />
                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
                                    <span>{t("admin.orders.grand_total", "Genel Toplam")}:</span>
                                    <span style={{ color: "#10b981" }}>{formatMoney(order.grand_total)}</span>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    {/* Addresses */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Card
                                title={<Space><EnvironmentOutlined /> {t("admin.orders.billing_address", "Fatura Adresi")}</Space>}
                                size="small"
                                style={{ borderRadius: 12, border: "1px solid #f0f0f5" }}
                            >
                                {order.billing_address ? (
                                    <>
                                        <Typography.Text strong>{order.billing_address.full_name}</Typography.Text>
                                        {order.billing_address.company && <div>{order.billing_address.company}</div>}
                                        <div style={{ marginTop: 8, color: "#6b7280" }}>{order.billing_address.full_address}</div>
                                        {order.billing_address.phone && (
                                            <div style={{ marginTop: 8 }}><PhoneOutlined /> {order.billing_address.phone}</div>
                                        )}
                                        {order.billing_address.email && (
                                            <div style={{ marginTop: 4 }}><MailOutlined /> {order.billing_address.email}</div>
                                        )}
                                    </>
                                ) : (
                                    <Typography.Text type="secondary">{t("admin.orders.no_address", "Adres bilgisi yok")}</Typography.Text>
                                )}
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card
                                title={<Space><CarOutlined /> {t("admin.orders.shipping_address", "Teslimat Adresi")}</Space>}
                                size="small"
                                style={{ borderRadius: 12, border: "1px solid #f0f0f5" }}
                            >
                                {order.shipping_address ? (
                                    <>
                                        {isSameAddress ? (
                                            <Typography.Text type="secondary">Fatura adresi ile aynı.</Typography.Text>
                                        ) : (
                                            <>
                                                <Typography.Text strong>{order.shipping_address.full_name}</Typography.Text>
                                                {order.shipping_address.company && <div>{order.shipping_address.company}</div>}
                                                <div style={{ marginTop: 8, color: "#6b7280" }}>{order.shipping_address.full_address}</div>
                                                {order.shipping_address.phone && (
                                                    <div style={{ marginTop: 8 }}><PhoneOutlined /> {order.shipping_address.phone}</div>
                                                )}
                                                {order.shipping_address.email && (
                                                    <div style={{ marginTop: 4 }}><MailOutlined /> {order.shipping_address.email}</div>
                                                )}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <Typography.Text type="secondary">{t("admin.orders.no_address", "Adres bilgisi yok")}</Typography.Text>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </Col>

                {/* Right Column - Status & Actions */}
                <Col span={8}>
                    {/* Customer */}
                    <Card
                        title={<Space><UserOutlined /> {t("admin.orders.customer", "Müşteri")}</Space>}
                        size="small"
                        style={{ borderRadius: 12, border: "1px solid #f0f0f5", marginBottom: 16 }}
                    >
                        {order.customer ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <Avatar size={48} style={{ background: "#5E5CE6" }}>
                                    {order.customer.first_name?.[0]}
                                </Avatar>
                                <div>
                                    <Typography.Text strong>{order.customer.full_name}</Typography.Text>
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                                        <MailOutlined /> {order.customer.email}
                                    </div>
                                    {order.customer.phone && (
                                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                                            <PhoneOutlined /> {order.customer.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <Typography.Text strong>{t("admin.orders.guest_customer", "Misafir Müşteri")}</Typography.Text>
                                {(order.billing_address?.full_name || order.shipping_address?.full_name) && (
                                    <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                                        {order.billing_address?.full_name || order.shipping_address?.full_name}
                                    </div>
                                )}
                                {(order.billing_address?.email || order.shipping_address?.email) && (
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                                        <MailOutlined /> {order.billing_address?.email || order.shipping_address?.email}
                                    </div>
                                )}
                                {(order.billing_address?.phone || order.shipping_address?.phone) && (
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                                        <PhoneOutlined /> {order.billing_address?.phone || order.shipping_address?.phone}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Status */}
                    <Card
                        title={<Space><SyncOutlined /> {t("admin.orders.order_status", "Sipariş Durumu")}</Space>}
                        size="small"
                        style={{ borderRadius: 12, border: "1px solid #f0f0f5", marginBottom: 16 }}
                        extra={!editingStatus && <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingStatus(true); setNewStatus(order.status); }}>{t("admin.common.change", "Değiştir")}</Button>}
                    >
                        {editingStatus ? (
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Select
                                    value={newStatus || order.status}
                                    onChange={(v) => setNewStatus(v)}
                                    style={{ width: "100%" }}
                                    options={options ? Object.entries(options.statuses).map(([v, l]) => ({ value: v, label: l })) : []}
                                />
                                <Space>
                                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => updateOrder({ status: newStatus as OrderStatus })}>{t("admin.common.save", "Kaydet")}</Button>
                                    <Button onClick={() => setEditingStatus(false)}>{t("admin.common.cancel", "İptal")}</Button>
                                </Space>
                            </Space>
                        ) : (
                            <Tag color={statusColors[order.status]} style={{ fontSize: 14, padding: "4px 12px" }}>
                                {options?.statuses[order.status] || order.status}
                            </Tag>
                        )}
                    </Card>

                    {/* Payment Status */}
                    <Card
                        title={<Space><DollarOutlined /> {t("admin.orders.payment_status_title", "Ödeme Durumu")}</Space>}
                        size="small"
                        style={{ borderRadius: 12, border: "1px solid #f0f0f5", marginBottom: 16 }}
                        extra={!editingPayment && <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingPayment(true); setNewPaymentStatus(order.payment_status); }}>{t("admin.common.change", "Değiştir")}</Button>}
                    >
                        {editingPayment ? (
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Select
                                    value={newPaymentStatus || order.payment_status}
                                    onChange={(v) => setNewPaymentStatus(v)}
                                    style={{ width: "100%" }}
                                    options={options ? Object.entries(options.payment_statuses).map(([v, l]) => ({ value: v, label: l })) : []}
                                />
                                <Space>
                                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => updateOrder({ payment_status: newPaymentStatus as PaymentStatus })}>{t("admin.common.save", "Kaydet")}</Button>
                                    <Button onClick={() => setEditingPayment(false)}>{t("admin.common.cancel", "İptal")}</Button>
                                </Space>
                            </Space>
                        ) : (
                            <>
                                <Tag color={order.payment_status === "paid" ? "success" : order.payment_status === "pending" ? "warning" : "error"} style={{ fontSize: 14, padding: "4px 12px" }}>
                                    {options?.payment_statuses[order.payment_status] || order.payment_status}
                                </Tag>
                                {order.payment_method && (
                                    <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
                                        {t("admin.orders.payment_method", "Yöntem")}: {order.payment_method}
                                    </div>
                                )}
                            </>
                        )}
                    </Card>

                    {/* Shipping */}
                    <Card
                        title={<Space><CarOutlined /> {t("admin.orders.shipping_info", "Kargo Bilgileri")}</Space>}
                        size="small"
                        style={{ borderRadius: 12, border: "1px solid #f0f0f5", marginBottom: 16 }}
                        extra={!editingTracking && <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setEditingTracking(true)}>{t("admin.common.edit", "Düzenle")}</Button>}
                    >
                        {editingTracking ? (
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Input
                                    placeholder={t("admin.orders.shipping_carrier", "Kargo Firması")}
                                    value={carrier}
                                    onChange={(e) => setCarrier(e.target.value)}
                                />
                                <Input
                                    placeholder={t("admin.orders.tracking_number", "Takip Numarası")}
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                />
                                <Space>
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        loading={saving}
                                        onClick={() => updateOrder({ shipping_carrier: carrier, shipping_tracking_number: trackingNumber })}
                                    >
                                        {t("admin.common.save", "Kaydet")}
                                    </Button>
                                    <Button onClick={() => setEditingTracking(false)}>{t("admin.common.cancel", "İptal")}</Button>
                                </Space>
                            </Space>
                        ) : (
                            <>
                                {order.shipping_carrier || order.shipping_tracking_number ? (
                                    <>
                                        {order.shipping_carrier && <div><strong>{t("admin.orders.carrier", "Firma")}:</strong> {order.shipping_carrier}</div>}
                                        {order.shipping_tracking_number && <div><strong>{t("admin.orders.tracking", "Takip No")}:</strong> {order.shipping_tracking_number}</div>}
                                    </>
                                ) : (
                                    <Typography.Text type="secondary">{t("admin.orders.no_shipping_info", "Kargo bilgisi henüz girilmedi")}</Typography.Text>
                                )}
                            </>
                        )}
                    </Card>

                    {/* Notes */}
                    <Card
                        title={<Space><FileTextOutlined /> {t("admin.orders.notes", "Notlar")}</Space>}
                        size="small"
                        style={{ borderRadius: 12, border: "1px solid #f0f0f5", marginBottom: 16 }}
                        extra={<Button type="link" size="small" icon={<EditOutlined />} onClick={() => setNoteModalOpen(true)}>{t("admin.orders.add_note", "Not Ekle")}</Button>}
                    >
                        {order.admin_note ? (
                            <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>
                                {order.admin_note}
                            </div>
                        ) : (
                            <Typography.Text type="secondary">{t("admin.orders.no_notes", "Henüz not eklenmedi")}</Typography.Text>
                        )}
                    </Card>

                    {/* History */}
                    <Card
                        title={<Space><HistoryOutlined /> {t("admin.orders.order_history", "Sipariş Geçmişi")}</Space>}
                        size="small"
                        style={{ borderRadius: 12, border: "1px solid #f0f0f5" }}
                    >
                        {order.histories && order.histories.length > 0 ? (
                            <Timeline
                                items={order.histories.slice(0, 5).map((h) => ({
                                    color: h.action === "created" ? "green" : h.action.includes("cancel") ? "red" : "blue",
                                    children: (
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{h.note || h.action}</div>
                                            <div style={{ fontSize: 12, color: "#6b7280" }}>
                                                {dayjs(h.created_at).format("DD MMM YYYY HH:mm")}
                                                {h.user && ` • ${h.user.name}`}
                                            </div>
                                        </div>
                                    ),
                                }))}
                            />
                        ) : (
                            <Typography.Text type="secondary">{t("admin.orders.no_history", "Geçmiş yok")}</Typography.Text>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Note Modal */}
            <Modal
                title={t("admin.orders.add_note", "Not Ekle")}
                open={noteModalOpen}
                onCancel={() => setNoteModalOpen(false)}
                onOk={addNote}
                okText={t("admin.common.save", "Kaydet")}
                cancelText={t("admin.common.cancel", "İptal")}
                confirmLoading={saving}
            >
                <TextArea
                    rows={4}
                    placeholder={t("admin.orders.note_placeholder", "Sipariş hakkında not yazın...")}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                />
            </Modal>
        </>
    );
}
