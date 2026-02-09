"use client";

import React, { useState } from 'react';
import { App, Button, Checkbox, Col, Form, Input, InputNumber, Row, Select, Space } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { SectionCard } from '@/components/admin/SectionCard';
import { t } from '@/lib/i18n';
import { Unit } from '@/hooks/useUnit';
import { apiFetch } from '@/lib/api';

interface ProductGeneralSectionProps {
    tagOptions: Array<{ value: string; label: string }>;
    tagLoading: boolean;
    onSearchTags: (q: string) => void;
    brandOptions: Array<{ value: number; label: string }>;
    brandLoading?: boolean;
    units: Unit[];
}

export const ProductGeneralSection: React.FC<ProductGeneralSectionProps> = ({
    tagOptions,
    tagLoading,
    onSearchTags,
    brandOptions,
    brandLoading,
    units
}) => {
    const { message } = App.useApp();
    const [generatingSku, setGeneratingSku] = useState(false);
    const form = Form.useFormInstance();
    const showUnitPricing = Form.useWatch('show_unit_pricing', form);
    const unitType = Form.useWatch('unit_type', form);

    const handleGenerateProductSku = async () => {
        const productName = String(form.getFieldValue('name') ?? '').trim();
        const rawProductId = form.getFieldValue('id');
        const excludeProductId = Number.isFinite(Number(rawProductId)) && Number(rawProductId) > 0
            ? Number(rawProductId)
            : undefined;

        try {
            setGeneratingSku(true);
            const response = await apiFetch<{ sku?: string }>('/api/products/generate-sku', {
                method: 'POST',
                json: {
                    type: 'product',
                    name: productName || undefined,
                    exclude_product_id: excludeProductId,
                },
            });

            const nextSku = String(response?.sku ?? '').trim();
            if (!nextSku) {
                throw new Error('SKU üretilemedi.');
            }

            form.setFieldValue('sku', nextSku);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'SKU oluşturulamadı.';
            message.error(errorMessage);
        } finally {
            setGeneratingSku(false);
        }
    };

    return (
        <SectionCard title={t('admin.product.form.tabs.general', 'Temel Bilgi')} id="general">
            <Row gutter={16}>
                <Col span={16}>
                    <Form.Item
                        name="name"
                        label={t('admin.product.form.name.label', 'Ürün Adı')}
                        rules={[{ required: true, message: t('admin.product.form.name.required', 'Lütfen ürün adını giriniz') }]}
                    >
                        <Input size="large" placeholder={t('admin.product.form.name.placeholder', 'Ürün adını girin')} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        label={t('admin.product.form.sku.label', 'SKU (Stok Kodu)')}
                    >
                        <Space.Compact style={{ width: '100%' }}>
                            <Form.Item name="sku" noStyle>
                                <Input size="large" placeholder={t('admin.product.form.sku.placeholder', 'Benzersiz stok kodu')} />
                            </Form.Item>
                            <Button
                                size="large"
                                icon={<SyncOutlined />}
                                loading={generatingSku}
                                onClick={() => void handleGenerateProductSku()}
                                title="SKU otomatik oluştur"
                            >
                                Otomatik
                            </Button>
                        </Space.Compact>
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item
                        name="brand_id"
                        label={t('admin.product.form.brand.label', 'Marka')}
                    >
                        <Select
                            showSearch
                            placeholder={t('admin.product.form.brand.placeholder', 'Marka seçin')}
                            optionFilterProp="label"
                            options={brandOptions}
                            size="large"
                            allowClear
                            loading={brandLoading}
                        />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="gtin"
                        label={t('admin.product.form.gtin.label', 'Barkod / GTIN')}
                    >
                        <Input size="large" placeholder="EAN, UPC, GTIN vb." />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="tags"
                        label={t('admin.product.form.tags.label', 'Etiketler')}
                    >
                        <Select
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder={t('admin.product.form.tags.placeholder', 'Etiket ekleyin')}
                            onSearch={onSearchTags}
                            loading={tagLoading}
                            options={tagOptions}
                            size="large"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="show_unit_pricing" valuePropName="checked" style={{ marginTop: 8 }}>
                <Checkbox>
                    {t('admin.product.form.show_unit_pricing', 'Bu ürün için birim fiyat göster')}
                </Checkbox>
            </Form.Item>

            {showUnitPricing ? (
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="unit_type" label={t('admin.product.form.unit_type.label', 'Birim Seçiniz')}>
                            <Select
                                placeholder={t('admin.common.select', 'Seçiniz')}
                                allowClear
                                options={[
                                    { value: "global", label: t('admin.product.form.unit_type.global', 'Global Birim') },
                                    { value: "custom", label: t('admin.product.form.unit_type.custom', 'Ürüne Özel Oluştur') },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        {unitType === "global" ? (
                            <Form.Item name="sale_unit_id" label={t('admin.product.form.unit_type.global', 'Global Birim')}>
                                <Select
                                    placeholder={t('admin.product.form.unit_type.placeholder', 'Birim seçin')}
                                    allowClear
                                    options={units.map((u) => ({
                                        value: u.id,
                                        label: u.short_name ? `${u.name} (${u.short_name})` : u.name,
                                    }))}
                                />
                            </Form.Item>
                        ) : unitType === "custom" ? (
                            <Form.Item name={['custom_unit', 'label']} label={t('admin.product.form.unit.custom_label', 'Birim Etiketi')}>
                                <Input placeholder="Örn: Metre" />
                            </Form.Item>
                        ) : null}
                    </Col>

                    {unitType === "custom" ? (
                        <>
                            <Col span={4}>
                                <Form.Item name={['custom_unit', 'min']} label={t('admin.units.columns.min', 'Min')}>
                                    <InputNumber style={{ width: "100%" }} min={0} />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name={['custom_unit', 'max']} label={t('admin.units.columns.max', 'Max')}>
                                    <InputNumber style={{ width: "100%" }} min={0} />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name={['custom_unit', 'step']} label={t('admin.units.columns.step', 'Step')}>
                                    <InputNumber style={{ width: "100%" }} min={0} step={0.1} />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name={['custom_unit', 'quantity_prefix']} label="Miktar Prefix">
                                    <Input placeholder="Örn: Adet" />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name={['custom_unit', 'price_prefix']} label={t('admin.units.columns.price_prefix', 'Birim Fiyat Eki')}>
                                    <Input placeholder="Örn: / mt" />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name={['custom_unit', 'stock_prefix']} label={t('admin.units.columns.stock_prefix', 'Stok Eki')}>
                                    <Input placeholder="Örn: mt" />
                                </Form.Item>
                            </Col>
                            <Col span={4} style={{ display: 'flex', alignItems: 'center', paddingTop: 24 }}>
                                <Form.Item name={['custom_unit', 'is_decimal_stock']} valuePropName="checked" noStyle>
                                    <Checkbox>{t('admin.units.columns.is_decimal', 'Ondalıklı Stok')}</Checkbox>
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item name={['custom_unit', 'info_top']} label={t('admin.units.columns.info_top', 'Üst Bilgi')}>
                                    <Input placeholder={t('admin.units.columns.info_top.placeholder', 'Ürün detayda miktar alanının üstünde gösterilecek bilgi')} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name={['custom_unit', 'info_bottom']} label={t('admin.units.columns.info_bottom', 'Alt Bilgi')}>
                                    <Input placeholder={t('admin.units.columns.info_bottom.placeholder', 'Ürün detayda miktar alanının altında gösterilecek bilgi')} />
                                </Form.Item>
                            </Col>
                        </>
                    ) : null}
                </Row>
            ) : null}
        </SectionCard>
    );
};
