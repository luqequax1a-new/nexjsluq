"use client";

import React, { useState, useEffect } from "react";
import { Form, Input, InputNumber, Select, Switch, DatePicker, Radio, Row, Col, Space, Typography, Card, Divider, Button } from "antd";
import { SectionCard } from "@/components/admin/SectionCard";
import { RiseOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import { BottomActionBar } from "@/components/admin/BottomActionBar";
import dayjs from "dayjs";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface CouponFormProps {
    initialValues?: any;
    onSave: (values: any) => Promise<void>;
    saving: boolean;
    onBack?: () => void;
    mode: "manual" | "automatic";
}

export function CouponForm({ initialValues, onSave, saving, onBack, mode }: CouponFormProps) {
    const [form] = Form.useForm();
    const [appliesTo, setAppliesTo] = useState(initialValues?.applies_to || "all");
    const [customerEligibility, setCustomerEligibility] = useState(initialValues?.customer_eligibility || "all");
    const [minReqType, setMinReqType] = useState(initialValues?.min_requirement_type || "none");
    const [discountType, setDiscountType] = useState(initialValues?.discount_type || "simple");

    // Remote data states
    const [customerOptions, setCustomerOptions] = useState<any[]>([]);
    const [customerGroupOptions, setCustomerGroupOptions] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Load lists provided in initialValues (for edit mode)
    useEffect(() => {
        if (initialValues) {
            if (initialValues.products) setProducts(initialValues.products);
            if (initialValues.categories) setCategories(initialValues.categories);

            form.setFieldsValue({
                ...initialValues,
                start_date: initialValues.start_date ? dayjs(initialValues.start_date) : null,
                end_date: initialValues.end_date ? dayjs(initialValues.end_date) : null,
                product_ids: initialValues.products?.map((p: any) => p.id),
                category_ids: initialValues.categories?.map((c: any) => c.id),
                customer_ids: initialValues.customers?.map((c: any) => c.id),
                customer_group_ids: initialValues.customer_groups?.map((cg: any) => cg.id),
            });

            if (initialValues.products) {
                setProductOptions(initialValues.products.map((p: any) => ({ label: p.name, value: p.id })));
            }
            if (initialValues.categories) {
                setCategoryOptions(initialValues.categories.map((c: any) => ({ label: c.name, value: c.id })));
            }
            if (initialValues.customers) {
                setCustomerOptions(initialValues.customers.map((c: any) => ({
                    label: `${c.first_name} ${c.last_name} (${c.email})`,
                    value: c.id
                })));
            }
            if (initialValues.customer_groups) {
                setCustomerGroupOptions(initialValues.customer_groups.map((cg: any) => ({ label: cg.name, value: cg.id })));
            }
        }
    }, [initialValues, form]);

    // Async search options
    const [productOptions, setProductOptions] = useState<any[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<any[]>([]);

    const handleProductSearch = async (value: string) => {
        if (!value) return;
        try {
            const res = await apiFetch<any>(`/api/products?search=${value}&per_page=10`);
            setProductOptions(res.data.map((p: any) => ({ label: p.name, value: p.id })));
        } catch (e) {
            console.error(e);
        }
    };

    const handleCategorySearch = async (value: string) => {
        try {
            const res = await apiFetch<any[]>(`/api/categories`);
            const flat = flattenCategories(res);
            setCategoryOptions(flat.filter(c => c.label.toLowerCase().includes(value.toLowerCase())));
        } catch (e) { console.error(e); }
    };

    const handleCustomerSearch = async (value: string) => {
        if (!value) return;
        try {
            const res = await apiFetch<any>(`/api/customers?search=${value}&per_page=20`);
            setCustomerOptions(res.data.map((c: any) => ({
                label: `${c.first_name} ${c.last_name} (${c.email})`,
                value: c.id
            })));
        } catch (e) {
            console.error(e);
        }
    };

    const flattenCategories = (cats: any[]): any[] => {
        let res: any[] = [];
        cats.forEach(c => {
            res.push({ label: c.name, value: c.id });
            if (c.children) res = [...res, ...flattenCategories(c.children)];
        });
        return res;
    };

    useEffect(() => {
        const loadCats = async () => {
            try {
                const res = await apiFetch<any[]>(`/api/categories`);
                setCategoryOptions(flattenCategories(res));
            } catch (e) { }
        };
        const loadGroups = async () => {
            try {
                const res = await apiFetch<any[]>(`/api/customers/groups`);
                setCustomerGroupOptions(res.map((cg: any) => ({ label: cg.name, value: cg.id })));
            } catch (e) { }
        };
        loadCats();
        loadGroups();
    }, []);

    // Watch fields for summary
    const watchedCode = Form.useWatch('code', form);
    const watchedName = Form.useWatch('name', form);
    const watchedType = Form.useWatch('type', form);
    const watchedValue = Form.useWatch('value', form);

    useEffect(() => {
        if (initialValues) {
            const values = { ...initialValues };

            // Map relations to IDs if they exist
            if (initialValues.products) values.product_ids = initialValues.products.map((p: any) => p.id);
            if (initialValues.categories) values.category_ids = initialValues.categories.map((c: any) => c.id);
            if (initialValues.customers) values.customer_ids = initialValues.customers.map((c: any) => c.id);
            if (initialValues.customerGroups) values.customer_group_ids = initialValues.customerGroups.map((g: any) => g.id);

            // Handle dates
            if (initialValues.start_date) values.start_date = dayjs(initialValues.start_date);
            if (initialValues.end_date) values.end_date = dayjs(initialValues.end_date);

            // Sync state
            if (initialValues.discount_type) setDiscountType(initialValues.discount_type);
            if (initialValues.applies_to) setAppliesTo(initialValues.applies_to);
            if (initialValues.customer_eligibility) setCustomerEligibility(initialValues.customer_eligibility);

            form.setFieldsValue(values);
        }
    }, [initialValues]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            await onSave(values);
        } catch (e) {
            // validation error
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={{
                type: 'fixed',
                discount_type: 'simple',
                applies_to: 'all',
                customer_eligibility: 'all',
                min_requirement_type: 'none',
                is_active: true,
                is_automatic: mode === 'automatic',
                can_combine_with_other_coupons: false,
                can_combine_with_auto_discounts: true,
                priority: 0,
                get_discount_percentage: 100,
            }}
        >
            <Form.Item name="is_automatic" hidden>
                <Switch />
            </Form.Item>
            <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 0" }}>

                <Row gutter={24}>
                    <Col span={16}>
                        <SectionCard title={t("admin.marketing.coupons.general", "Genel Bilgiler")}>
                            {mode === 'manual' ? (
                                <Form.Item
                                    name="code"
                                    label={t("admin.marketing.coupons.code", "Kupon Kodu")}
                                    rules={[{ required: true }]}
                                    extra={t("admin.marketing.coupons.code_help", "Müşterilerin ödeme ekranında gireceği kod")}
                                >
                                    <Input size="large" style={{ textTransform: "uppercase", fontWeight: 600 }} placeholder="YAZ2024" />
                                </Form.Item>
                            ) : (
                                <Form.Item
                                    name="name"
                                    label={t("admin.marketing.coupons.title", "Kampanya Başlığı")}
                                    rules={[{ required: true }]}
                                    extra={t("admin.marketing.coupons.title_help", "Müşteriler sepetlerinde bu başlığı görecek")}
                                >
                                    <Input size="large" placeholder="Yaz İndirimi" />
                                </Form.Item>
                            )}

                            <Form.Item name="description" label={t("admin.common.description", "Açıklama")}>
                                <TextArea rows={2} placeholder="Sadece admin panelinde görünür" />
                            </Form.Item>
                        </SectionCard>

                        <SectionCard title={t("admin.marketing.coupons.value", "İndirim Değeri")}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="type" label={t("admin.marketing.coupons.type", "İndirim Tipi")}>
                                        <Select size="large">
                                            <Select.Option value="percentage">Yüzde İndirim (%)</Select.Option>
                                            <Select.Option value="fixed">Sabit Tutar (₺)</Select.Option>
                                            <Select.Option value="free_shipping">Ücretsiz Kargo</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prev, curr) => prev.type !== curr.type}
                                    >
                                        {({ getFieldValue }) => getFieldValue('type') !== 'free_shipping' && (
                                            <Form.Item name="value" label={t("admin.marketing.coupons.amount", "İndirim Tutarı")} rules={[{ required: true }]}>
                                                <InputNumber size="large" style={{ width: '100%' }} min={0} />
                                            </Form.Item>
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>
                        </SectionCard>

                        <SectionCard title={t("admin.marketing.coupons.campaign_type", "Kampanya Tipi")}>
                            <Form.Item name="discount_type" label={t("admin.marketing.coupons.form.discount_type_label", "Kampanya Türü")}>
                                <Radio.Group onChange={e => setDiscountType(e.target.value)}>
                                    <Space direction="vertical">
                                        <Radio value="simple">{t("admin.marketing.coupons.form.type_simple", "Basit İndirim (Yüzde veya Sabit Tutar)")}</Radio>
                                        <Radio value="bxgy">{t("admin.marketing.coupons.form.type_bxgy", "X Al Y Bedava (Buy X Get Y)")}</Radio>
                                        <Radio value="tiered">{t("admin.marketing.coupons.form.type_tiered", "Kademeli İndirim (Spend X Get Y)")}</Radio>
                                    </Space>
                                </Radio.Group>
                            </Form.Item>

                            {discountType === 'bxgy' && (
                                <div style={{
                                    background: '#f8fafc',
                                    padding: 20,
                                    borderRadius: 12,
                                    border: '1px solid #e2e8f0',
                                    marginTop: 16
                                }}>
                                    <Text strong style={{ display: 'block', marginBottom: 16, color: '#1e293b' }}>
                                        {t("admin.marketing.coupons.form.bxgy_settings", "\"X Al Y Bedava\" Ayarları")}
                                    </Text>
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item
                                                name="buy_quantity"
                                                label={t("admin.marketing.coupons.form.customer_buys", "Müşteri Alır (X)")}
                                                rules={[{ required: true, message: t("admin.common.required", "Bu alan zorunludur") }]}
                                            >
                                                <InputNumber min={1} style={{ width: '100%' }} placeholder="3" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="get_quantity"
                                                label={t("admin.marketing.coupons.form.customer_gets", "İndirimli Alır (Y)")}
                                                rules={[{ required: true, message: t("admin.common.required", "Bu alan zorunludur") }]}
                                            >
                                                <InputNumber min={1} style={{ width: '100%' }} placeholder="1" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="get_discount_percentage"
                                                label={t("admin.marketing.coupons.form.discount_rate", "İndirim Oranı (%)")}
                                                extra={t("admin.marketing.coupons.form.free_extra", "100 = Tamamen bedava")}
                                            >
                                                <InputNumber min={0} max={100} style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prev, curr) =>
                                            prev.buy_quantity !== curr.buy_quantity ||
                                            prev.get_quantity !== curr.get_quantity ||
                                            prev.get_discount_percentage !== curr.get_discount_percentage
                                        }
                                    >
                                        {({ getFieldValue }) => {
                                            const buy = getFieldValue('buy_quantity');
                                            const get = getFieldValue('get_quantity');
                                            const pct = getFieldValue('get_discount_percentage');
                                            if (buy && get) {
                                                return (
                                                    <div style={{ marginBottom: 24, padding: '8px 12px', background: '#e0f2fe', borderRadius: 6, color: '#0369a1', fontSize: 13 }}>
                                                        <RiseOutlined style={{ marginRight: 8 }} />
                                                        {t("admin.marketing.coupons.form.bxgy_preview_prefix", "Kural: Sepete")} <b>{buy}</b> {t("admin.marketing.coupons.form.bxgy_preview_mid1", "adet ürün eklendiğinde, sonraki")} <b>{get}</b> {t("admin.marketing.coupons.form.bxgy_preview_mid2", "adet ürün")} <b>%{pct || 100}</b> {t("admin.marketing.coupons.form.bxgy_preview_suffix", "indirimli olacak.")}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    </Form.Item>

                                    <Form.Item
                                        name="buy_product_ids"
                                        label={t("admin.marketing.coupons.form.buy_products_label", "Alınacak Ürünler (Opsiyonel)")}
                                        extra={t("admin.marketing.coupons.form.buy_products_extra", "Boş bırakılırsa tüm ürünler geçerlidir.")}
                                    >
                                        <Select
                                            mode="multiple"
                                            placeholder={t("admin.orders.select_customer", "Ürün ara...")}
                                            onSearch={handleProductSearch}
                                            showSearch
                                            filterOption={false}
                                            options={productOptions}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="get_product_ids"
                                        label={t("admin.marketing.coupons.form.get_products_label", "İndirimli Olacak Ürünler (Opsiyonel)")}
                                        extra={t("admin.marketing.coupons.form.get_products_extra", "Boş bırakılırsa 'Müşteri Alır' kısmındaki ürünlerle aynı kabul edilir.")}
                                    >
                                        <Select
                                            mode="multiple"
                                            placeholder={t("admin.orders.select_customer", "Ürün ara...")}
                                            onSearch={handleProductSearch}
                                            showSearch
                                            filterOption={false}
                                            options={productOptions}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </div>
                            )}

                            {discountType === 'tiered' && (
                                <div style={{
                                    background: '#fff7ed',
                                    padding: 20,
                                    borderRadius: 12,
                                    border: '1px solid #ffedd5',
                                    marginTop: 16
                                }}>
                                    <Text strong style={{ display: 'block', marginBottom: 16, color: '#9a3412' }}>
                                        {t("admin.marketing.coupons.form.tiered_settings", "\"Kademeli İndirim\" Kuralları (Harca & Kazan)")}
                                    </Text>

                                    <Form.List name="tiered_data">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }) => (
                                                    <Space key={key} style={{ display: 'flex', marginBottom: 16, alignItems: 'flex-start' }} align="baseline">
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'min']}
                                                            label={t("admin.marketing.coupons.form.tiered_min_spend", "Min. Harcama (₺)")}
                                                            rules={[{ required: true, message: t("admin.common.required", "Bu alan zorunludur") }]}
                                                        >
                                                            <InputNumber min={1} placeholder="1000" style={{ width: 140 }} />
                                                        </Form.Item>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'value']}
                                                            label={t("admin.marketing.coupons.form.tiered_discount", "İndirim")}
                                                            rules={[{ required: true, message: t("admin.common.required", "Bu alan zorunludur") }]}
                                                        >
                                                            <InputNumber min={1} placeholder="10" style={{ width: 120 }} />
                                                        </Form.Item>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'type']}
                                                            label={t("admin.marketing.coupons.form.tiered_type", "Tip")}
                                                            initialValue="percentage"
                                                        >
                                                            <Select style={{ width: 120 }}>
                                                                <Select.Option value="percentage">%</Select.Option>
                                                                <Select.Option value="fixed">₺</Select.Option>
                                                            </Select>
                                                        </Form.Item>
                                                        <Button
                                                            danger
                                                            type="text"
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => remove(name)}
                                                            style={{ marginTop: 32 }}
                                                        />
                                                    </Space>
                                                ))}
                                                <Button
                                                    type="dashed"
                                                    onClick={() => add()}
                                                    block
                                                    icon={<PlusOutlined />}
                                                    style={{ height: 45, borderRadius: 8 }}
                                                >
                                                    {t("admin.marketing.coupons.form.tiered_add", "Yeni Kademe Ekle")}
                                                </Button>
                                            </>
                                        )}
                                    </Form.List>

                                    <div style={{ marginTop: 16, padding: '10px 15px', background: '#ffead0', borderRadius: 8, fontSize: 13, color: '#9a3412' }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            💡 {t("admin.marketing.coupons.form.tiered_hint", "İpucu: Müşterinin sepet tutarına uyan <b>en yüksek</b> kademe otomatik olarak uygulanır.")}
                                        </Text>
                                    </div>
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard title={t("admin.marketing.coupons.min_req", "Minimum Gereksinimler")}>
                            <Form.Item name="min_requirement_type">
                                <Radio.Group onChange={e => setMinReqType(e.target.value)}>
                                    <Space direction="vertical">
                                        <Radio value="none">{t("admin.marketing.coupons.req.none", "Yok")}</Radio>
                                        <Radio value="amount">{t("admin.marketing.coupons.req.amount", "Minimum Sepet Tutarı (₺)")}</Radio>
                                        <Radio value="quantity">{t("admin.marketing.coupons.req.quantity", "Minimum Ürün Adedi")}</Radio>
                                    </Space>
                                </Radio.Group>
                            </Form.Item>

                            {minReqType !== 'none' && (
                                <Form.Item name="min_requirement_value" rules={[{ required: true }]}>
                                    <InputNumber style={{ width: 200 }} min={0} />
                                </Form.Item>
                            )}
                        </SectionCard>

                        <SectionCard title={t("admin.marketing.coupons.eligibility", "Müşteri Uygunluğu")}>
                            <Form.Item name="customer_eligibility">
                                <Radio.Group onChange={e => setCustomerEligibility(e.target.value)}>
                                    <Space direction="vertical">
                                        <Radio value="all">{t("admin.marketing.coupons.cust.all", "Tüm Müşteriler")}</Radio>
                                        <Radio value="specific_groups">{t("admin.marketing.coupons.cust.groups", "Belirli Müşteri Grupları")}</Radio>
                                        <Radio value="specific_customers">{t("admin.marketing.coupons.cust.spec", "Belirli Müşteriler")}</Radio>
                                    </Space>
                                </Radio.Group>
                            </Form.Item>

                            {customerEligibility === 'specific_groups' && (
                                <Form.Item
                                    name="customer_group_ids"
                                    rules={[{ required: true, message: t("admin.common.required", "Bu alan zorunludur") }]}
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder="Müşteri grubu seç..."
                                        options={customerGroupOptions}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            )}

                            {customerEligibility === 'specific_customers' && (
                                <Form.Item
                                    name="customer_ids"
                                    rules={[{ required: true, message: t("admin.common.required", "Bu alan zorunludur") }]}
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder={t("admin.orders.select_customer", "Müşteri ara...")}
                                        showSearch
                                        filterOption={false}
                                        onSearch={handleCustomerSearch}
                                        options={customerOptions}
                                        notFoundContent={null}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            )}
                        </SectionCard>

                        <SectionCard title={t("admin.marketing.coupons.applies_to", "Uygulama Hedefi")}>
                            <Form.Item name="applies_to">
                                <Radio.Group onChange={e => setAppliesTo(e.target.value)}>
                                    <Space direction="vertical">
                                        <Radio value="all">{t("admin.marketing.coupons.target.all", "Tüm Sipariş")}</Radio>
                                        <Radio value="specific_categories">{t("admin.marketing.coupons.target.cats", "Belirli Kategoriler")}</Radio>
                                        <Radio value="specific_products">{t("admin.marketing.coupons.target.prod", "Belirli Ürünler")}</Radio>
                                    </Space>
                                </Radio.Group>
                            </Form.Item>

                            {appliesTo === 'specific_products' && (
                                <Form.Item name="product_ids" rules={[{ required: true, message: t("admin.common.required", "Bu alan zorunludur") }]}>
                                    <Select
                                        mode="multiple"
                                        placeholder={t("admin.orders.select_customer", "Ürün ara...")}
                                        onSearch={handleProductSearch}
                                        showSearch
                                        filterOption={false}
                                        options={productOptions}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            )}

                            {appliesTo === 'specific_categories' && (
                                <Form.Item name="category_ids" rules={[{ required: true, message: t("admin.common.required", "Bu alan zorunludur") }]}>
                                    <Select
                                        mode="multiple"
                                        placeholder={t("admin.orders.select_category", "Kategori seç...")}
                                        options={categoryOptions}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            )}
                        </SectionCard>
                    </Col>

                    <Col span={8}>
                        <SectionCard title={t("admin.common.status", "Durum")}>
                            <Form.Item name="is_active" valuePropName="checked" style={{ marginBottom: 0 }}>
                                <Switch checkedChildren={t("admin.common.active", "Aktif")} unCheckedChildren={t("admin.common.inactive", "Pasif")} />
                            </Form.Item>
                        </SectionCard>

                        <SectionCard title={t("admin.marketing.coupons.dates", "Tarihler")}>
                            <Form.Item name="start_date" label={t("admin.common.start_date", "Başlangıç")}>
                                <DatePicker showTime style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item name="end_date" label={t("admin.common.end_date_optional", "Bitiş (Opsiyonel)")}>
                                <DatePicker showTime style={{ width: '100%' }} />
                            </Form.Item>
                        </SectionCard>

                        <SectionCard title={t("admin.marketing.coupons.limits", "Kullanım Limitleri")}>
                            <Form.Item name="usage_limit" label={t("admin.marketing.coupons.form.total_limit", "Toplam Kullanım Limiti")}>
                                <InputNumber style={{ width: '100%' }} min={1} placeholder={t("admin.common.example", "Örn:") + " 100"} />
                            </Form.Item>
                            <Form.Item name="usage_limit_per_customer" label={t("admin.marketing.coupons.form.customer_limit", "Müşteri Başına Limit")}>
                                <InputNumber style={{ width: '100%' }} min={1} placeholder={t("admin.common.example", "Örn:") + " 1"} />
                            </Form.Item>
                        </SectionCard>

                        <SectionCard title={t("admin.marketing.coupons.form.combination_title", "Kombinasyon ve Öncelik")}>
                            <Form.Item
                                name="can_combine_with_other_coupons"
                                valuePropName="checked"
                                extra={t("admin.marketing.coupons.form.combine_coupons_label", "Diğer kupon kodları ile birlikte kullanılabilir")}
                            >
                                <Switch checkedChildren={t("admin.common.yes", "Evet")} unCheckedChildren={t("admin.common.no", "Hayır")} />
                            </Form.Item>

                            <Form.Item
                                name="can_combine_with_auto_discounts"
                                valuePropName="checked"
                                extra={t("admin.marketing.coupons.form.combine_auto_label", "Otomatik indirimler ile birlikte kullanılabilir")}
                            >
                                <Switch checkedChildren={t("admin.common.yes", "Evet")} unCheckedChildren={t("admin.common.no", "Hayır")} />
                            </Form.Item>

                            <Form.Item
                                name="priority"
                                label={t("admin.marketing.coupons.form.priority_label", "Öncelik")}
                                extra={t("admin.marketing.coupons.form.priority_extra", "Yüksek öncelikli kuponlar önce uygulanır (0-100)")}
                            >
                                <InputNumber style={{ width: '100%' }} min={0} max={100} />
                            </Form.Item>
                        </SectionCard>

                        <div style={{ padding: 16 }}>
                            <Divider />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {mode === 'manual' ? (
                                    <>
                                        {t("admin.marketing.coupons.form.summary", "Özet")}: {watchedCode || t("admin.marketing.coupons.form.new_coupon_fallback", "Yeni Kupon")}
                                        <br />
                                    </>
                                ) : (
                                    <>
                                        {t("admin.marketing.coupons.form.summary", "Özet")}: {watchedName || t("admin.marketing.coupons.form.new_discount_fallback", "Yeni İndirim")}
                                        <br />
                                    </>
                                )}
                                {watchedType === 'percentage' ? `%${watchedValue || 0}` : `₺${watchedValue || 0}`} {t("admin.marketing.coupons.form.discount_text", "indirim")}
                                {discountType === 'tiered' && (
                                    <>
                                        <br />
                                        {t("admin.marketing.coupons.form.tiered_active", "Kademeli İndirim Etkin")}
                                    </>
                                )}
                            </Text>
                        </div>
                    </Col>
                </Row>

                <BottomActionBar
                    onSave={handleSubmit}
                    saving={saving}
                    onBack={onBack}
                />
            </div>
        </Form>
    );
}
