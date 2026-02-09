'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Select,
    InputNumber,
    Switch,
    Button,
    Space,
    Divider,
    Tag,
    Alert,
    Tooltip,
} from 'antd';
import {
    DeleteOutlined,
    InfoCircleOutlined,
    ShoppingOutlined,
    PercentageOutlined,
} from '@ant-design/icons';
import { apiFetch } from '@/lib/api';

interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    selling_price: number;
    unit?: {
        name: string;
        short_name: string;
        precision: number;
    };
    saleUnit?: {
        name: string;
        short_name: string;
        precision: number;
    };
    productUnit?: {
        label: string;
        precision?: number;
    };
    variants?: Array<{
        id: number;
        name: string;
        price: number;
        selling_price: number;
        sku: string;
    }>;
}

interface OfferProductCardProps {
    product: any;
    index: number;
    onUpdate: (updates: any) => void;
    onRemove: () => void;
    showCondition: boolean;
}

export function OfferProductCard({
    product,
    index,
    onUpdate,
    onRemove,
    showCondition,
}: OfferProductCardProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (product.product_id && products.length > 0) {
            const found = products.find((p) => p.id === product.product_id);
            setSelectedProduct(found || null);
        }
    }, [product.product_id, products]);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const data = await apiFetch<any>('/api/products?per_page=1000&with=unit,variants');
            setProducts(data.data || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleProductChange = (productId: number) => {
        const selected = products.find((p) => p.id === productId);
        setSelectedProduct(selected || null);
        onUpdate({
            product_id: productId,
            variant_id: null,
            allow_variant_selection: false,
        });
    };

    const calculateDiscountedPrice = () => {
        if (!selectedProduct) return 0;

        // Determine which price to use based on discount_base
        const discountBase = product.discount_base || 'selling_price';

        let basePrice = 0;
        if (product.variant_id) {
            const variant = selectedProduct.variants?.find((v) => v.id === product.variant_id);
            basePrice = discountBase === 'selling_price'
                ? (variant?.selling_price || variant?.price || 0)
                : (variant?.price || 0);
        } else {
            basePrice = discountBase === 'selling_price'
                ? (selectedProduct.selling_price || selectedProduct.price)
                : selectedProduct.price;
        }

        if (product.discount_type === 'percentage') {
            return basePrice * (1 - product.discount_value / 100);
        } else if (product.discount_type === 'fixed') {
            return Math.max(basePrice - product.discount_value, 0);
        }
        return basePrice;
    };

    // Backend returns saleUnit (global) or productUnit (custom)
    const unit = (selectedProduct?.saleUnit || selectedProduct?.productUnit || selectedProduct?.unit) as any;
    const unitLabel = unit?.short_name || unit?.label || 'adet';
    const precision = unit?.precision || 0;

    return (
        <Card
            title={
                <Space>
                    <ShoppingOutlined />
                    <span>Ürün #{index + 1}</span>
                    {showCondition && product.show_condition !== 'always' && (
                        <Tag color={product.show_condition === 'if_accepted' ? 'green' : 'orange'}>
                            {product.show_condition === 'if_accepted'
                                ? 'Kabul Edilirse'
                                : 'Reddedilirse'}
                        </Tag>
                    )}
                </Space>
            }
            extra={
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={onRemove}
                >
                    Kaldır
                </Button>
            }
            style={{ marginBottom: 16 }}
        >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Ürün Seçimi */}
                <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Ürün Seçin *
                    </label>
                    <Select
                        showSearch
                        placeholder="Ürün ara..."
                        value={product.product_id}
                        onChange={handleProductChange}
                        loading={loadingProducts}
                        style={{ width: '100%' }}
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={products.map((p) => ({
                            value: p.id,
                            label: `${p.name} (${p.sku})`,
                        }))}
                    />
                </div>

                {selectedProduct && (
                    <>
                        {/* Varyant Yönetimi */}
                        {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                            <div>
                                <Row gutter={16} align="middle">
                                    <Col span={12}>
                                        <div style={{ marginBottom: 8 }}>
                                            <Switch
                                                checked={product.allow_variant_selection}
                                                onChange={(checked) =>
                                                    onUpdate({ allow_variant_selection: checked, variant_id: null })
                                                }
                                            />
                                            <span style={{ marginLeft: 8 }}>
                                                Müşteri varyant seçebilsin
                                            </span>
                                            <Tooltip title="Aktif edilirse müşteri kendi varyantını seçer, pasifse siz belirlersiniz">
                                                <InfoCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                                            </Tooltip>
                                        </div>
                                    </Col>
                                </Row>

                                {!product.allow_variant_selection && (
                                    <div style={{ marginTop: 8 }}>
                                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                                            Sabit Varyant Seçin
                                        </label>
                                        <Select
                                            placeholder="Varyant seçin..."
                                            value={product.variant_id}
                                            onChange={(variantId) => onUpdate({ variant_id: variantId })}
                                            style={{ width: '100%' }}
                                            options={selectedProduct.variants.map((v) => ({
                                                value: v.id,
                                                label: `${v.name} - ${v.price}₺`,
                                            }))}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <Divider />

                        {/* İndirim Ayarları */}
                        <div>
                            <h4 style={{ marginBottom: 16 }}>
                                <PercentageOutlined /> İndirim Ayarları
                            </h4>
                            <Row gutter={16}>
                                <Col span={6}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                                        İndirim Hesaplama
                                    </label>
                                    <Select
                                        value={product.discount_base || 'selling_price'}
                                        onChange={(value) => onUpdate({ discount_base: value })}
                                        style={{ width: '100%' }}
                                    >
                                        <Select.Option value="selling_price">Satış Fiyatı Üzerinden</Select.Option>
                                        <Select.Option value="regular_price">Normal Fiyat Üzerinden</Select.Option>
                                    </Select>
                                </Col>
                                <Col span={6}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                                        İndirim Tipi
                                    </label>
                                    <Select
                                        value={product.discount_type}
                                        onChange={(value) => onUpdate({ discount_type: value })}
                                        style={{ width: '100%' }}
                                    >
                                        <Select.Option value="none">İndirimsiz</Select.Option>
                                        <Select.Option value="percentage">Yüzde (%)</Select.Option>
                                        <Select.Option value="fixed">Sabit Tutar (₺)</Select.Option>
                                    </Select>
                                </Col>
                                <Col span={6}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                                        İndirim Değeri
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <InputNumber
                                            value={product.discount_value}
                                            onChange={(value) => onUpdate({ discount_value: value || 0 })}
                                            min={0}
                                            max={product.discount_type === 'percentage' ? 100 : undefined}
                                            style={{ width: '100%', paddingRight: 30 }}
                                            disabled={product.discount_type === 'none'}
                                        />
                                        <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: 12 }}>
                                            {product.discount_type === 'percentage' ? '%' : '₺'}
                                        </span>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                                        İndirimli Fiyat
                                    </label>
                                    <div
                                        style={{
                                            padding: '8px 12px',
                                            background: '#f0f0f0',
                                            borderRadius: 6,
                                            fontWeight: 600,
                                            fontSize: 16,
                                            color: '#52c41a',
                                            height: 32,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {calculateDiscountedPrice().toFixed(2)} ₺
                                    </div>
                                </Col>
                            </Row>

                            {product.discount_type !== 'none' && product.discount_value > 0 && (
                                <Alert
                                    message={`Müşteri bu ürünü ${product.discount_type === 'percentage'
                                        ? `%${product.discount_value} indirimle`
                                        : `${product.discount_value}₺ indirimle`
                                        } alacak`}
                                    type="success"
                                    showIcon
                                    style={{ marginTop: 12 }}
                                />
                            )}
                        </div>

                        {/* Zincirleme Koşul */}
                        {showCondition && (
                            <>
                                <Divider />
                                <div>
                                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                                        Bu ürün ne zaman gösterilsin?
                                    </label>
                                    <Select
                                        value={product.show_condition}
                                        onChange={(value) => onUpdate({ show_condition: value })}
                                        style={{ width: '100%' }}
                                    >
                                        <Select.Option value="always">Her Zaman Göster</Select.Option>
                                        <Select.Option value="if_accepted">
                                            Önceki Teklif Kabul Edilirse
                                        </Select.Option>
                                        <Select.Option value="if_rejected">
                                            Önceki Teklif Reddedilirse
                                        </Select.Option>
                                    </Select>
                                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                        Zincirleme teklifler için kullanılır
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </Space>
        </Card>
    );
}
