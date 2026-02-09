"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Form,
    Input,
    Button,
    Card,
    Row,
    Col,
    Space,
    Typography,
    Divider,
    Table,
    InputNumber,
    Select,
    Modal,
    App,
    Badge,
    Empty,
    Avatar,
    Switch,
    Tag,
    Radio
} from "antd";
import {
    ShoppingCartOutlined,
    UserOutlined,
    EnvironmentOutlined,
    DeleteOutlined,
    PlusOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import { usePageHeader } from "@/hooks/usePageHeader";
import { CustomerSelector } from "@/components/admin/order/CustomerSelector";
import { ProductSearchSelector } from "@/components/admin/order/ProductSearchSelector";
import type { Customer, CustomerAddress, OrderFormData, ShippingMethod } from "@/types/order";

const { Title, Text } = Typography;

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function NewOrderPage() {
    const router = useRouter();
    const { message, modal } = App.useApp();
    const [form] = Form.useForm();

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [billingAddress, setBillingAddress] = useState<Partial<CustomerAddress> | null>(null);
    const [shippingAddress, setShippingAddress] = useState<Partial<CustomerAddress> | null>(null);
    const [sameAsBilling, setSameAsBilling] = useState(true);

    const [items, setItems] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [couponLoading, setCouponLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

    // Variant Selection Modal
    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState<any>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [itemQty, setItemQty] = useState<number>(1);

    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);

    useEffect(() => {
        const fetchShipping = async () => {
            try {
                const data = await apiFetch<ShippingMethod[]>("/api/settings/shipping-methods");
                setShippingMethods(data.filter(m => m.is_active));
            } catch (e) {
                console.error("Failed to fetch shipping methods", e);
            }
        };
        fetchShipping();
    }, []);

    usePageHeader({
        title: t("admin.orders.new_order", "Yeni Sipariş"),
        breadcrumb: [
            { label: t("admin.orders.title", "Siparişler"), href: "/admin/orders" },
            { label: t("admin.orders.new_order", "Yeni Sipariş") }
        ]
    });

    const handleCustomerChange = (id: number, customer: Customer) => {
        setSelectedCustomer(customer);
        const defaultBilling = customer.addresses?.find(a => a.is_default_billing) || customer.addresses?.[0];
        const defaultShipping = customer.addresses?.find(a => a.is_default_shipping) || customer.addresses?.[0];

        setBillingAddress(defaultBilling || null);
        setShippingAddress(defaultShipping || null);
        setSameAsBilling(true);
    };

    const handleProductSelect = (product: any) => {
        setActiveProduct(product);
        const unit = product.unit || { step: 1, min: 1, default_qty: 1 };
        setItemQty(unit.default_qty || unit.min || 1);

        if (product.variants && product.variants.length > 0) {
            setSelectedVariantId(product.variants[0].id);
            setVariantModalOpen(true);
        } else {
            setSelectedVariantId(null);
            addItemToCart(product, null, unit.default_qty || unit.min || 1);
        }
    };

    const addItemToCart = (product: any, variantId: number | null, qty: number) => {
        const variant = variantId ? product.variants.find((v: any) => v.id === variantId) : null;

        const newItem = {
            key: variant ? `v-${variant.id}` : `p-${product.id}`,
            product_id: product.id,
            variant_id: variantId,
            name: product.name,
            variant_name: variant ? variant.name : null,
            sku: variant ? variant.sku : product.sku,
            unit_price: variant ? (variant.selling_price || variant.price) : (product.selling_price || product.price),
            quantity: qty,
            unit: product.unit,
            image: variant?.media?.[0]?.path || product.media?.[0]?.path,
            tax_rate: product.tax_class?.rate || 0,
        };

        setItems(prev => {
            const exists = prev.find(item => item.key === newItem.key);
            if (exists) {
                return prev.map(item => item.key === newItem.key
                    ? { ...item, quantity: item.quantity + qty }
                    : item
                );
            }
            return [...prev, newItem];
        });

        setVariantModalOpen(false);
        setActiveProduct(null);
    };

    const removeItem = (key: string) => {
        setItems(prev => prev.filter(item => item.key !== key));
    };

    const updateItemQty = (key: string, qty: number) => {
        setItems(prev => prev.map(item => item.key === key ? { ...item, quantity: qty } : item));
    };

    // Watch form fields for totals calculation
    const currentShippingMethod = Form.useWatch("shipping_method", form);
    const shippingTotal = Form.useWatch("shipping_total", form) || 0;
    const discountTotal = Form.useWatch("discount_total", form) || 0;

    // Auto-calculate shipping total when method or subtotal changes
    useEffect(() => {
        if (!currentShippingMethod || shippingMethods.length === 0) return;

        const method = shippingMethods.find(m => m.code === currentShippingMethod);
        if (!method) return;

        const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        let cost = Number(method.base_rate);

        if (method.free_threshold !== null && subtotal >= Number(method.free_threshold)) {
            cost = 0;
        }

        form.setFieldValue("shipping_total", cost);
    }, [currentShippingMethod, items, shippingMethods, form]);

    // Validate Coupon
    const validateCoupon = async () => {
        const code = form.getFieldValue("coupon_code");
        if (!code) return;

        setCouponLoading(true);
        try {
            const customerId = selectedCustomer?.id;
            const res = await apiFetch<any>("/api/marketing/coupons/validate", {
                method: "POST",
                json: {
                    code,
                    subtotal: items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0),
                    customer_id: customerId
                }
            });
            setAppliedCoupon(res.coupon);
            form.setFieldValue("discount_total", res.discount);
            message.success(t("admin.marketing.coupons.applied", "Kupon uygulandı: -₺") + res.discount.toFixed(2));
        } catch (error: any) {
            setAppliedCoupon(null);
            form.setFieldValue("discount_total", 0);
            message.error(error.message || t("admin.marketing.coupons.invalid", "Geçersiz kupon"));
        } finally {
            setCouponLoading(false);
        }
    };

    // Calculate totals
    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        const taxTotal = items.reduce((sum, item) => {
            const lineTotal = item.unit_price * item.quantity;
            return sum + (lineTotal * (item.tax_rate / 100));
        }, 0);

        return {
            subtotal,
            taxTotal,
            shippingTotal,
            discountTotal,
            grandTotal: subtotal + taxTotal + shippingTotal - discountTotal
        };
    }, [items, shippingTotal, discountTotal]);

    const handleSave = async (values: any) => {
        if (items.length === 0) {
            message.warning(t("admin.orders.items_required", "Lütfen en az bir ürün ekleyin."));
            return;
        }

        if (!billingAddress) {
            message.warning(t("admin.orders.billing_address_required", "Lütfen fatura adresi seçin."));
            return;
        }

        setSaving(true);
        try {
            const { type: bType, ...bAddr } = billingAddress;
            const { type: sType, ...sAddr } = (sameAsBilling ? billingAddress : shippingAddress || billingAddress) as Partial<CustomerAddress>;

            const payload: OrderFormData = {
                customer_id: selectedCustomer?.id,
                items: items.map(item => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                })),
                billing_address: bAddr as any,
                shipping_address: sAddr as any,
                same_as_billing: sameAsBilling,
                payment_method: values.payment_method,
                shipping_method: values.shipping_method,
                shipping_total: values.shipping_total,
                discount_total: values.discount_total,
                customer_note: values.customer_note,
                admin_note: values.admin_note,
                status: 'pending',
                payment_status: 'pending'
            };

            await apiFetch("/api/orders", {
                method: "POST",
                json: payload
            });

            message.success(t("admin.orders.create_success", "Sipariş başarıyla oluşturuldu."));
            router.push("/admin/orders");
        } catch (error: any) {
            message.error(error.message || t("admin.common.error", "Bir hata oluştu."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
                payment_method: "bank_transfer",
                shipping_total: 0,
                discount_total: 0
            }}
        >
            <Row gutter={24}>
                {/* Left Column: Customer & Addresses */}
                <Col span={10}>
                    <Space direction="vertical" size={24} style={{ width: "100%" }}>
                        {/* Customer Selection */}
                        <Card
                            title={
                                <Space>
                                    <UserOutlined style={{ color: "#5E5CE6" }} />
                                    {t("admin.orders.customer_info", "Müşteri Bilgileri")}
                                </Space>
                            }
                            className="sh-card"
                        >
                            <CustomerSelector
                                value={selectedCustomer?.id}
                                onChange={handleCustomerChange}
                                onAddNew={() => router.push("/admin/customers")}
                            />

                            {selectedCustomer && (
                                <div style={{ marginTop: 20, padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #eef2f6" }}>
                                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                                        <Text strong style={{ fontSize: 16 }}>{selectedCustomer.full_name}</Text>
                                        <Text type="secondary">{selectedCustomer.email}</Text>
                                        <Text type="secondary">{selectedCustomer.phone}</Text>
                                        <div style={{ marginTop: 8 }}>
                                            <Tag color={selectedCustomer.group === 'vip' ? 'orange' : 'blue'}>
                                                {selectedCustomer.group.toUpperCase()}
                                            </Tag>
                                        </div>
                                    </Space>
                                </div>
                            )}
                        </Card>

                        {/* Address Section */}
                        {selectedCustomer && (
                            <Card
                                title={
                                    <Space>
                                        <EnvironmentOutlined style={{ color: "#5E5CE6" }} />
                                        {t("admin.orders.address_info", "Adres Bilgileri")}
                                    </Space>
                                }
                                className="sh-card"
                            >
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong style={{ marginBottom: 8, display: "block" }}>{t("admin.orders.billing_address", "Fatura Adresi")}</Text>
                                    <Select
                                        style={{ width: "100%" }}
                                        value={billingAddress?.id}
                                        onChange={(val) => setBillingAddress(selectedCustomer.addresses?.find(a => a.id === val) || null)}
                                        options={selectedCustomer.addresses?.map(a => ({
                                            label: (
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span>{a.title} - {a.address_line_1}</span>
                                                    <Tag color={a.type === 'corporate' ? 'purple' : 'default'} style={{ fontSize: 10 }}>
                                                        {a.type === 'corporate' ? t("admin.customers.address.form.corporate", "Kurumsal") : t("admin.customers.address.form.individual", "Bireysel")}
                                                    </Tag>
                                                </div>
                                            ),
                                            value: a.id
                                        }))}
                                        placeholder={t("admin.orders.select_billing_address", "Fatura adresi seçin")}
                                    />
                                    {billingAddress && (
                                        <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 8, fontSize: 13, background: "#fff" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                <Text strong>{billingAddress.first_name} {billingAddress.last_name}</Text>
                                                <Tag color={billingAddress.type === 'corporate' ? 'purple' : 'blue'} bordered={false} style={{ fontSize: 10 }}>
                                                    {billingAddress.type === 'corporate' ? 'KURUMSAL' : 'BİREYSEL'}
                                                </Tag>
                                            </div>
                                            {billingAddress.type === 'corporate' && billingAddress.company && (
                                                <Text strong style={{ display: "block", color: "#6366f1", marginBottom: 2 }}>{billingAddress.company}</Text>
                                            )}
                                            <Text type="secondary">{billingAddress.address_line_1}</Text><br />
                                            <Text type="secondary">{billingAddress.city} / {billingAddress.state}</Text>
                                            {billingAddress.type === 'corporate' && (
                                                <div style={{ marginTop: 4, fontSize: 11, color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: 4 }}>
                                                    {billingAddress.tax_office && <span>VD: {billingAddress.tax_office} | </span>}
                                                    {billingAddress.tax_number && <span>VN: {billingAddress.tax_number}</span>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Divider style={{ margin: "16px 0" }} />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                    <Text strong>{t("admin.orders.same_as_billing", "Teslimat adresi fatura adresi ile aynı")}</Text>
                                    <Switch checked={sameAsBilling} onChange={setSameAsBilling} />
                                </div>

                                {!sameAsBilling && (
                                    <div style={{ animation: "fadeIn 0.3s" }}>
                                        <Text strong style={{ marginBottom: 8, display: "block" }}>{t("admin.orders.shipping_address", "Teslimat Adresi")}</Text>
                                        <Select
                                            style={{ width: "100%" }}
                                            value={shippingAddress?.id}
                                            onChange={(val) => setShippingAddress(selectedCustomer.addresses?.find(a => a.id === val) || null)}
                                            options={selectedCustomer.addresses?.map(a => ({
                                                label: (
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span>{a.title} - {a.address_line_1}</span>
                                                        <Tag color={a.type === 'corporate' ? 'purple' : 'default'} style={{ fontSize: 10 }}>
                                                            {a.type === 'corporate' ? 'K' : 'B'}
                                                        </Tag>
                                                    </div>
                                                ),
                                                value: a.id
                                            }))}
                                            placeholder={t("admin.orders.select_shipping_address", "Teslimat adresi seçin")}
                                        />
                                        {shippingAddress && (
                                            <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 8, fontSize: 13, background: "#fff" }}>
                                                <Text strong>{shippingAddress.first_name} {shippingAddress.last_name}</Text><br />
                                                <Text type="secondary">{shippingAddress.address_line_1}</Text><br />
                                                <Text type="secondary">{shippingAddress.city} / {shippingAddress.state}</Text>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Notes */}
                        <Card title={t("admin.orders.notes", "Notlar")} className="sh-card">
                            <Form.Item name="customer_note" label={t("admin.orders.customer_note", "Müşteri Notu")}>
                                <Input.TextArea rows={2} placeholder={t("admin.orders.customer_note_placeholder", "Müşterinin görmesini istediğiniz not...")} />
                            </Form.Item>
                            <Form.Item name="admin_note" label={t("admin.orders.admin_note", "Admin Notu")}>
                                <Input.TextArea rows={2} placeholder={t("admin.orders.admin_note_placeholder", "Sadece personelin görebileceği not...")} />
                            </Form.Item>
                        </Card>
                    </Space>
                </Col>

                {/* Right Column: Products & Totals */}
                <Col span={14}>
                    <Space direction="vertical" size={24} style={{ width: "100%" }}>
                        {/* Product Search */}
                        <Card className="sh-card">
                            <ProductSearchSelector onSelect={handleProductSelect} />
                        </Card>

                        {/* Items Table */}
                        <Card
                            title={
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                    <Space>
                                        <ShoppingCartOutlined style={{ color: "#5E5CE6" }} />
                                        {t("admin.orders.items", "Sipariş Ürünleri")}
                                    </Space>
                                    <Badge count={items.length} color="#5E5CE6" />
                                </div>
                            }
                            className="sh-card"
                            styles={{ body: { padding: 0 } }}
                        >
                            <Table
                                dataSource={items}
                                pagination={false}
                                rowKey="key"
                                locale={{ emptyText: <Empty description={t("admin.orders.no_items", "Siparişe ürün eklenmedi")} /> }}
                                columns={[
                                    {
                                        title: t("admin.orders.columns.product", "Ürün"),
                                        key: "product",
                                        render: (_: any, record: any) => (
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <Avatar shape="square" src={record.image} icon={<ShoppingCartOutlined />} />
                                                <div>
                                                    <Text strong style={{ display: "block" }}>{record.name}</Text>
                                                    {record.variant_name && <Text type="secondary" style={{ fontSize: 12 }}>{record.variant_name}</Text>}
                                                    <Text type="secondary" style={{ fontSize: 11, display: "block" }}>{record.sku}</Text>
                                                </div>
                                            </div>
                                        )
                                    },
                                    {
                                        title: t("admin.orders.columns.price", "Fiyat"),
                                        dataIndex: "unit_price",
                                        width: 120,
                                        render: (val: number) => formatCurrency(val)
                                    },
                                    {
                                        title: t("admin.orders.columns.qty", "Miktar"),
                                        key: "quantity",
                                        width: 140,
                                        render: (_: any, record: any) => {
                                            const unit = record.unit || {};
                                            return (
                                                <Space.Compact style={{ width: "100%" }}>
                                                    <InputNumber
                                                        value={record.quantity}
                                                        onChange={(val) => updateItemQty(record.key, val || 0)}
                                                        min={unit.min || 0}
                                                        step={unit.is_decimal_stock ? (unit.step || 0.1) : (unit.step || 1)}
                                                        precision={unit.is_decimal_stock ? 2 : 0}
                                                        style={{ width: "100%" }}
                                                    />
                                                    <div style={{ padding: "0 10px", display: "flex", alignItems: "center", border: "1px solid #d9d9d9", borderLeft: 0, background: "#fafafa", color: "#64748b", fontWeight: 600 }}>
                                                        {unit.stock_prefix || unit.suffix}
                                                    </div>
                                                </Space.Compact>
                                            );
                                        }
                                    },
                                    {
                                        title: t("admin.orders.columns.line_total", "Tutar"),
                                        key: "total",
                                        align: "right",
                                        render: (_: any, record: any) => formatCurrency(record.unit_price * record.quantity)
                                    },
                                    {
                                        key: "actions",
                                        width: 50,
                                        render: (_: any, record: any) => (
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => removeItem(record.key)}
                                            />
                                        )
                                    }
                                ]}
                            />
                        </Card>

                        {/* Order Summary & Settings */}
                        <Card className="sh-card">
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="payment_method" label={t("admin.orders.payment_method", "Ödeme Yöntemi")}>
                                        <Select
                                            options={[
                                                { label: "Banka Havalesi", value: "bank_transfer" },
                                                { label: "Kapıda Ödeme", value: "cod" },
                                                { label: "Kredi Kartı (Link)", value: "credit_card_link" },
                                                { label: "Nakit (Ofis)", value: "cash" }
                                            ]}
                                        />
                                    </Form.Item>
                                    <Form.Item name="shipping_method" label={t("admin.orders.shipping_method", "Gönderim Yöntemi")}>
                                        <Select
                                            placeholder={t("admin.orders.select_shipping_method", "Kargo seçin")}
                                            options={shippingMethods.map(m => ({
                                                label: (
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                        <span>{m.name}</span>
                                                        {Number(m.free_threshold) > 0 && (
                                                            <Text type="secondary" style={{ fontSize: 10 }}>
                                                                {formatCurrency(Number(m.free_threshold))}+ {t("admin.common.free", "Bedava")}
                                                            </Text>
                                                        )}
                                                    </div>
                                                ),
                                                value: m.code
                                            }))}
                                        />
                                    </Form.Item>
                                    <div style={{ marginTop: 16 }}>
                                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                                            {t("admin.marketing.coupons.form.code", "Kupon Kodu")}
                                        </Text>
                                        <Space.Compact style={{ width: "100%" }}>
                                            <Form.Item name="coupon_code" noStyle>
                                                <Input
                                                    placeholder={t("admin.marketing.coupons.placeholder", "Kupon kodunu girin")}
                                                    style={{ textTransform: "uppercase" }}
                                                />
                                            </Form.Item>
                                            <Button
                                                loading={couponLoading}
                                                onClick={validateCoupon}
                                                disabled={!items.length}
                                            >
                                                {t("admin.common.apply", "Uygula")}
                                            </Button>
                                        </Space.Compact>
                                        {appliedCoupon && (
                                            <div style={{ marginTop: 4 }}>
                                                <Tag color="success" closable onClose={() => {
                                                    setAppliedCoupon(null);
                                                    form.setFieldValue("coupon_code", "");
                                                    form.setFieldValue("discount_total", 0);
                                                }}>
                                                    {appliedCoupon.name} (%{appliedCoupon.value})
                                                </Tag>
                                            </div>
                                        )}
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12 }}>
                                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <Text type="secondary">{t("admin.orders.subtotal", "Ara Toplam")}</Text>
                                                <Text strong>{formatCurrency(totals.subtotal)}</Text>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <Text type="secondary">{t("admin.orders.tax_total", "KDV")}</Text>
                                                <Text strong>{formatCurrency(totals.taxTotal)}</Text>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Text type="secondary">{t("admin.orders.shipping_total", "Kargo")}</Text>
                                                <Form.Item name="shipping_total" noStyle>
                                                    <InputNumber
                                                        size="small"
                                                        style={{ width: 100 }}
                                                        min={0}
                                                        precision={2}
                                                        prefix="₺"
                                                    />
                                                </Form.Item>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Text type="secondary">{t("admin.orders.discount_total", "İndirim")}</Text>
                                                <Form.Item name="discount_total" noStyle>
                                                    <InputNumber
                                                        size="small"
                                                        style={{ width: 100 }}
                                                        min={0}
                                                        precision={2}
                                                        prefix="₺"
                                                    />
                                                </Form.Item>
                                            </div>
                                            <Divider style={{ margin: "8px 0" }} />
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Title level={4} style={{ margin: 0 }}>{t("admin.orders.grand_total", "Genel Toplam")}</Title>
                                                <Title level={4} style={{ margin: 0, color: "#10b981" }}>{formatCurrency(totals.grandTotal)}</Title>
                                            </div>
                                        </Space>
                                    </div>

                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        style={{ marginTop: 20, height: 50, borderRadius: 10, fontSize: 16, fontWeight: 700 }}
                                        onClick={() => form.submit()}
                                        loading={saving}
                                    >
                                        {t("admin.orders.create_order", "Siparişi Oluştur")}
                                    </Button>
                                </Col>
                            </Row>
                        </Card>
                    </Space>
                </Col>
            </Row>

            {/* Variant Selection Modal */}
            <Modal
                title={t("admin.orders.select_variant", "Varyant Seçimi")}
                open={variantModalOpen}
                onCancel={() => setVariantModalOpen(false)}
                onOk={() => {
                    if (selectedVariantId && activeProduct) {
                        addItemToCart(activeProduct, selectedVariantId, itemQty);
                    }
                }}
                okText={t("admin.common.add", "Ekle")}
                cancelText={t("admin.common.cancel", "İptal")}
                width={500}
            >
                {activeProduct && (
                    <div style={{ padding: "12px 0" }}>
                        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                            <Avatar shape="square" size={64} src={activeProduct.media?.[0]?.path} icon={<ShoppingCartOutlined />} />
                            <div>
                                <Text strong style={{ fontSize: 16, display: "block" }}>{activeProduct.name}</Text>
                                <Text type="secondary">{activeProduct.sku}</Text>
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <Text strong style={{ display: "block", marginBottom: 8 }}>{t("admin.orders.variant", "Varyant Seçin")}</Text>
                            <Radio.Group
                                value={selectedVariantId}
                                onChange={(e) => setSelectedVariantId(e.target.value)}
                                style={{ width: "100%" }}
                            >
                                <Space direction="vertical" style={{ width: "100%" }}>
                                    {activeProduct.variants.map((v: any) => (
                                        <Radio.Button
                                            key={v.id}
                                            value={v.id}
                                            style={{ width: "100%", height: "auto", padding: "8px 16px", borderRadius: 8, marginBottom: 4 }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <Text strong>{v.name}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: 11 }}>{v.sku}</Text>
                                                </div>
                                                <Text strong>₺{(v.selling_price || v.price).toFixed(2)}</Text>
                                            </div>
                                        </Radio.Button>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </div>

                        <div>
                            <Text strong style={{ display: "block", marginBottom: 8 }}>{t("admin.orders.quantity", "Miktar")}</Text>
                            <Space.Compact style={{ width: "100%" }}>
                                <InputNumber
                                    min={activeProduct.unit?.min || 1}
                                    step={activeProduct.unit?.is_decimal_stock ? (activeProduct.unit?.step || 0.1) : (activeProduct.unit?.step || 1)}
                                    precision={activeProduct.unit?.is_decimal_stock ? 2 : 0}
                                    value={itemQty}
                                    onChange={(val) => setItemQty(val || 1)}
                                    style={{ width: "100%" }}
                                />
                                <div style={{ padding: "0 10px", display: "flex", alignItems: "center", border: "1px solid #d9d9d9", borderLeft: 0, background: "#fafafa", color: "#64748b", fontWeight: 600 }}>
                                    {activeProduct.unit?.stock_prefix || activeProduct.unit?.suffix}
                                </div>
                            </Space.Compact>
                        </div>
                    </div>
                )}
            </Modal>
        </Form>
    );
}
