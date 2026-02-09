"use client";

import React from 'react';
import { Form, Row, Col, Select, InputNumber, Space, DatePicker } from 'antd';
import { SectionCard } from '@/components/admin/SectionCard';
import { t } from '@/lib/i18n';
import dayjs from 'dayjs';
import { useUnit, Unit } from '@/hooks/useUnit';

interface ProductPricingSectionProps {
    units: Unit[];
    taxClasses: any[];
    hasAnyVariant: boolean;
    selectedUnit?: any;
}

export const ProductPricingSection: React.FC<ProductPricingSectionProps> = ({
    units,
    taxClasses,
    hasAnyVariant,
    selectedUnit: propSelectedUnit
}) => {
    const form = Form.useFormInstance();
    const watchedVariations = Form.useWatch("variations", form);
    const watchedVariants = Form.useWatch("variants", form);
    const showUnitPricing = Form.useWatch("show_unit_pricing", form);
    const unitType = Form.useWatch("unit_type", form);
    const customUnit = Form.useWatch("custom_unit", form);
    const saleUnitId = Form.useWatch("sale_unit_id", form);

    const isVariantManaged = (Array.isArray(watchedVariations) && watchedVariations.length > 0)
        || ((Array.isArray(watchedVariants) ? watchedVariants : []).filter((v: any) => v?.is_active !== false && v?.is_active !== 0).length > 0)
        || Boolean(hasAnyVariant);

    const { selectedUnit: calculatedUnit } = useUnit(
        unitType === 'custom' ? customUnit : saleUnitId,
        units
    );

    const effectiveUnit = propSelectedUnit || calculatedUnit;

    const priceRules = isVariantManaged
        ? []
        : [{ required: true, message: t('admin.product.form.price.required', 'Lütfen satış fiyatını giriniz') }];
    const discountRules = isVariantManaged
        ? []
        : [
            ({ getFieldValue }: any) => ({
                validator(_: any, value: any) {
                    if (!value || !getFieldValue('price') || Number(value) <= Number(getFieldValue('price'))) {
                        return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('admin.product.form.discount_price.error', 'İndirimli fiyat normal fiyattan büyük olamaz')));
                },
            }),
        ];

    return (
        <SectionCard title={t('admin.product.form.tabs.pricing', 'Fiyatlandırma')} id="pricing">
            {isVariantManaged ? (
                <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #91d5ff',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: 16,
                    fontSize: 13,
                    color: '#2563eb'
                }}>
                    {t('admin.product.form.variant_pricing_desc', 'Bu üründe varyant olduğu için fiyatlandırma varyantlar üzerinden yönetilir. Lütfen fiyatları varyantlardan düzenleyiniz.')}
                </div>
            ) : null}

            {!isVariantManaged ? (
            <Row gutter={24}>
                <Col span={5}>
                    <Form.Item label={<span style={{ fontWeight: 600 }}>{t('admin.product.form.price.label', 'Satış Fiyatı')}</span>} required={!isVariantManaged}>
                        <Space.Compact style={{ width: "100%", maxWidth: 140, opacity: isVariantManaged ? 0.6 : 1 }}>
                            <Form.Item
                                name="price"
                                noStyle
                                rules={priceRules}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    size="large"
                                    min={0}
                                    prefix="₺"
                                    controls={false}
                                    placeholder="0"
                                    decimalSeparator="."
                                    disabled={isVariantManaged}
                                    parser={(value: any) => {
                                        if (!value) return "";
                                        const s = String(value).replace(/\s/g, "").replace(/,/g, ".");
                                        return s.replace(/[^0-9.\-]/g, "");
                                    }}
                                    formatter={(value: any) => value ? `${value}` : ''}
                                    onKeyDown={(e) => {
                                        const allowedKeys = ["Backspace", "Tab", "Enter", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
                                        if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || /^[0-9]$/.test(e.key)) return;
                                        if (e.key === "." || e.key === "," || e.key === "Decimal" || ("code" in e && (e as any).code === "NumpadDecimal")) return;
                                        e.preventDefault();
                                    }}
                                />
                            </Form.Item>
                            {showUnitPricing && (unitType === 'custom' ? customUnit?.price_prefix : effectiveUnit?.price_prefix) && (
                                <div style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderLeft: 'none',
                                    padding: '0 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#64748b'
                                }}>
                                    {unitType === 'custom' ? customUnit?.price_prefix : effectiveUnit?.price_prefix}
                                </div>
                            )}
                        </Space.Compact>
                    </Form.Item>
                </Col>
                <Col span={5}>
                    <Form.Item
                        label={<span style={{ fontWeight: 600 }}>{t('admin.product.form.discount_price.label', 'İndirimli Fiyat')}</span>}
                    >
                        <Space.Compact style={{ width: "100%", maxWidth: 140, opacity: isVariantManaged ? 0.6 : 1 }}>
                            <Form.Item
                                name="discount_price"
                                noStyle
                                dependencies={['price']}
                                rules={discountRules}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    size="large"
                                    min={0}
                                    prefix="₺"
                                    controls={false}
                                    placeholder="0"
                                    decimalSeparator="."
                                    disabled={isVariantManaged}
                                    parser={(value: any) => {
                                        if (!value) return "";
                                        const s = String(value).replace(/\s/g, "").replace(/,/g, ".");
                                        return s.replace(/[^0-9.\-]/g, "");
                                    }}
                                    formatter={(value: any) => value ? `${value}` : ''}
                                    onKeyDown={(e) => {
                                        const allowedKeys = ["Backspace", "Tab", "Enter", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
                                        if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || /^[0-9]$/.test(e.key)) return;
                                        if (e.key === "." || e.key === "," || e.key === "Decimal" || ("code" in e && (e as any).code === "NumpadDecimal")) return;
                                        e.preventDefault();
                                    }}
                                />
                            </Form.Item>
                            {showUnitPricing && (unitType === 'custom' ? customUnit?.price_prefix : effectiveUnit?.price_prefix) && (
                                <div style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderLeft: 'none',
                                    padding: '0 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#64748b'
                                }}>
                                    {unitType === 'custom' ? customUnit?.price_prefix : effectiveUnit?.price_prefix}
                                </div>
                            )}
                        </Space.Compact>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue }) => {
                            const dp = getFieldValue("discount_price");
                            const start = getFieldValue("discount_start");
                            const end = getFieldValue("discount_end");
                            const value: any = start || end ? [start ? dayjs(start) : null, end ? dayjs(end) : null] : null;

                            return (
                                <Form.Item label={<span style={{ fontWeight: 600 }}>{t('admin.product.form.discount_date.label', 'İndirim Tarihi')}</span>}>
                                    <DatePicker.RangePicker
                                        value={value}
                                        disabled={isVariantManaged || !dp}
                                        allowEmpty={[true, true]}
                                        size="large"
                                        style={{ width: "100%", opacity: isVariantManaged ? 0.6 : 1 }}
                                        onChange={(vals) => {
                                            const s = vals?.[0] ? vals[0].toISOString() : null;
                                            const e = vals?.[1] ? vals[1].toISOString() : null;
                                            form.setFieldsValue({ discount_start: s, discount_end: e });
                                        }}
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name="tax_class_id" label={t('admin.product.form.tax_class.label', 'Vergi Sınıfı')}>
                        <Select
                            options={taxClasses.map(t => ({ value: t.id, label: t.label }))}
                            placeholder={t('admin.product.form.tax_class.placeholder', 'Vergi sınıfı seçin')}
                            allowClear
                            size="large"
                        />
                    </Form.Item>
                </Col>
            </Row>
            ) : null}

            {isVariantManaged && (
                <div style={{ marginBottom: 16 }}>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item 
                                name="global_tax_class_id" 
                                label={
                                    <span style={{ fontWeight: 600 }}>
                                        {t('admin.product.form.global_tax_class.label', 'Genel Vergi Sınıfı')}
                                        <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}>
                                            ({t('admin.product.form.global_tax_class.desc', 'Tüm varyantlara uygulanır')})
                                        </span>
                                    </span>
                                }
                            >
                                <Select
                                    options={taxClasses.map(t => ({ value: t.id, label: t.label }))}
                                    placeholder={t('admin.product.form.global_tax_class.placeholder', 'Tüm varyantlar için vergi sınıfı seçin')}
                                    allowClear
                                    size="large"
                                    onChange={(value) => {
                                        // Apply global tax class to all variants
                                        const variants = form.getFieldValue('variants') || [];
                                        if (variants.length > 0) {
                                            const updatedVariants = variants.map((variant: any) => ({
                                                ...variant,
                                                tax_class_id: value
                                            }));
                                            form.setFieldValue('variants', updatedVariants);
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>
            )}

            {null}
        </SectionCard>
    );
};
