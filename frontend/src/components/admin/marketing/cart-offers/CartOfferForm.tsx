'use client';

import { useState, useEffect } from 'react';
import {
    Form,
    Input,
    Select,
    Switch,
    InputNumber,
    DatePicker,
    Button,
    Space,
    Card,
    Row,
    Col,
    Divider,
    Alert,
    Tabs,
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    InfoCircleOutlined,
    ThunderboltOutlined,
    GiftOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { SectionCard } from '@/components/admin/SectionCard';
import { OfferProductCard } from './OfferProductCard';
import { TriggerSelector } from './TriggerSelector';
import { ConditionsPanel } from './ConditionsPanel';
import { DisplaySettingsPanel } from './DisplaySettingsPanel';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface CartOfferFormProps {
    initialValues?: any;
    onSave: (values: any) => Promise<void>;
    saving: boolean;
    onBack: () => void;
}

interface OfferProduct {
    id?: string;
    product_id: number | null;
    variant_id: number | null;
    allow_variant_selection: boolean;
    discount_type: 'percentage' | 'fixed' | 'none';
    discount_base: 'selling_price' | 'regular_price';
    discount_value: number;
    display_order: number;
    show_condition: 'always' | 'if_accepted' | 'if_rejected';
}

export function CartOfferForm({ initialValues, onSave, saving, onBack }: CartOfferFormProps) {
    const [form] = Form.useForm();
    const [offerProducts, setOfferProducts] = useState<OfferProduct[]>([]);
    const [activeTab, setActiveTab] = useState('basic');

    useEffect(() => {
        if (initialValues) {
            // Transform initial values
            const formData = {
                ...initialValues,
                date_range: initialValues.starts_at && initialValues.ends_at
                    ? [dayjs(initialValues.starts_at), dayjs(initialValues.ends_at)]
                    : null,
            };
            form.setFieldsValue(formData);

            if (initialValues.products && initialValues.products.length > 0) {
                setOfferProducts(
                    initialValues.products.map((p: any, index: number) => ({
                        ...p,
                        id: `product-${index}`,
                        display_order: index,
                    }))
                );
            }
        }
    }, [initialValues, form]);

    const handleAddProduct = () => {
        const newProduct: OfferProduct = {
            id: `product-${Date.now()}`,
            product_id: null,
            variant_id: null,
            allow_variant_selection: false,
            discount_type: 'percentage',
            discount_base: 'selling_price',
            discount_value: 0,
            display_order: offerProducts.length,
            show_condition: 'always',
        };
        setOfferProducts([...offerProducts, newProduct]);
    };

    const handleRemoveProduct = (id: string) => {
        setOfferProducts(offerProducts.filter((p) => p.id !== id));
    };

    const handleUpdateProduct = (id: string, updates: Partial<OfferProduct>) => {
        setOfferProducts(
            offerProducts.map((p) => (p.id === id ? { ...p, ...updates } : p))
        );
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Normalize display_config booleans (antd Switch can leave undefined)
            const dc = values.display_config || {};
            const display_config = {
                countdown_enabled: !!dc.countdown_enabled,
                countdown_minutes: dc.countdown_enabled ? (dc.countdown_minutes ?? null) : null,
                badge_text: dc.badge_text || '',
                badge_color: dc.badge_color || '#4f46e5',
                modal_size: dc.modal_size || 'medium',
                show_product_image: dc.show_product_image !== false,
                show_original_price: dc.show_original_price !== false,
                auto_close_on_add: dc.auto_close_on_add !== false,
                accept_button_text: dc.accept_button_text || '',
                reject_button_text: dc.reject_button_text || '',
            };

            // Transform data for API
            const payload = {
                ...values,
                display_config,
                starts_at: values.date_range?.[0]?.toISOString() || null,
                ends_at: values.date_range?.[1]?.toISOString() || null,
                products: offerProducts.map((p, index) => ({
                    product_id: p.product_id,
                    variant_id: p.variant_id,
                    allow_variant_selection: p.allow_variant_selection,
                    discount_type: p.discount_type,
                    discount_base: p.discount_base,
                    discount_value: p.discount_value,
                    display_order: index,
                    show_condition: p.show_condition,
                })),
            };

            delete payload.date_range;

            await onSave(payload);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const tabItems = [
        {
            key: 'basic',
            label: (
                <span>
                    <InfoCircleOutlined /> Temel Bilgiler
                </span>
            ),
            children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <SectionCard title="Genel Bilgiler">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="name"
                                    label="Teklif Adı (Dahili)"
                                    rules={[{ required: true, message: 'Teklif adı gerekli' }]}
                                    tooltip="Bu isim sadece admin panelde görünür"
                                >
                                    <Input placeholder="Örn: Sepet Tamamlama Teklifi" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="priority"
                                    label="Öncelik"
                                    tooltip="Yüksek öncelikli teklifler önce gösterilir"
                                >
                                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="title"
                            label="Müşteriye Gösterilecek Başlık"
                            rules={[{ required: true, message: 'Başlık gerekli' }]}
                        >
                            <Input placeholder="Örn: Özel Teklif Sizin İçin!" />
                        </Form.Item>

                        <Form.Item name="description" label="Açıklama (Opsiyonel)">
                            <TextArea rows={3} placeholder="Teklifin detaylı açıklaması..." />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="is_active"
                                    label="Durum"
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" defaultChecked />
                                </Form.Item>
                            </Col>
                        </Row>
                    </SectionCard>

                    <SectionCard title="Yerleşim ve Tetikleyici">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="placement"
                                    label="Teklif Nerede Gösterilsin?"
                                    rules={[{ required: true, message: 'Yerleşim seçimi gerekli' }]}
                                >
                                    <Select>
                                        <Select.Option value="cart">🛒 Sepet Sayfası</Select.Option>
                                        <Select.Option value="checkout">💳 Ödeme Sayfası</Select.Option>
                                        <Select.Option value="product_page">📦 Ürün Detay Sayfası</Select.Option>
                                        <Select.Option value="post_checkout">✅ Sipariş Sonrası</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <TriggerSelector form={form} />
                    </SectionCard>

                    <SectionCard title="Geçerlilik Tarihleri">
                        <Form.Item name="date_range" label="Teklif Geçerlilik Tarihleri">
                            <RangePicker
                                showTime
                                format="DD.MM.YYYY HH:mm"
                                style={{ width: '100%' }}
                                placeholder={['Başlangıç', 'Bitiş']}
                            />
                        </Form.Item>
                    </SectionCard>
                </Space>
            ),
        },
        {
            key: 'products',
            label: (
                <span>
                    <GiftOutlined /> Teklif Ürünleri ({offerProducts.length})
                </span>
            ),
            children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                        message="Teklif Ürünleri"
                        description="Müşteriye sunulacak ürünleri ekleyin. Birden fazla ürün ekleyerek zincirleme teklifler oluşturabilirsiniz."
                        type="info"
                        showIcon
                        icon={<GiftOutlined />}
                    />

                    {offerProducts.length === 0 ? (
                        <Card>
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <GiftOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                                <p style={{ color: '#999', marginBottom: 16 }}>
                                    Henüz ürün eklenmedi
                                </p>
                                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProduct}>
                                    İlk Ürünü Ekle
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <>
                            {offerProducts.map((product, index) => (
                                <OfferProductCard
                                    key={product.id}
                                    product={product}
                                    index={index}
                                    onUpdate={(updates) => handleUpdateProduct(product.id!, updates)}
                                    onRemove={() => handleRemoveProduct(product.id!)}
                                    showCondition={offerProducts.length > 1}
                                />
                            ))}

                            <Button
                                type="dashed"
                                block
                                icon={<PlusOutlined />}
                                onClick={handleAddProduct}
                                style={{ marginTop: 16 }}
                            >
                                Yeni Ürün Ekle (Zincirleme Teklif)
                            </Button>
                        </>
                    )}
                </Space>
            ),
        },
        {
            key: 'conditions',
            label: (
                <span>
                    <ThunderboltOutlined /> Koşullar
                </span>
            ),
            children: <ConditionsPanel form={form} />,
        },
        {
            key: 'display',
            label: 'Görünüm Ayarları',
            children: <DisplaySettingsPanel form={form} />,
        },
    ];

    return (
        <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
            <Form form={form} layout="vertical">
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabItems}
                        size="large"
                        style={{
                            background: '#fff',
                            borderRadius: 8,
                            padding: '16px 24px',
                        }}
                    />

                    <div
                        style={{
                            position: 'sticky',
                            bottom: 0,
                            background: '#fff',
                            padding: '16px 24px',
                            borderTop: '1px solid #f0f0f0',
                            marginTop: 24,
                            borderRadius: 8,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Button onClick={onBack}>İptal</Button>
                        <Space>
                            {offerProducts.length === 0 && (
                                <Alert
                                    message="En az 1 ürün eklemelisiniz"
                                    type="warning"
                                    showIcon
                                    style={{ marginRight: 16 }}
                                />
                            )}
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleSubmit}
                                loading={saving}
                                disabled={offerProducts.length === 0}
                            >
                                {initialValues ? 'Güncelle' : 'Oluştur'}
                            </Button>
                        </Space>
                    </div>
                </div>
            </Form>
        </div>
    );
}
