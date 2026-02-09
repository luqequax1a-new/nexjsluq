"use client";

import React from 'react';
import { Form, Row, Col, InputNumber, Space, Alert, App, Checkbox } from 'antd';
import { SectionCard } from '@/components/admin/SectionCard';
import { t } from '@/lib/i18n';
import { useUnit, Unit } from '@/hooks/useUnit';

interface ProductInventorySectionProps {
    units: Unit[];
    hasAnyVariant: boolean;
    selectedUnit?: any;
}

export const ProductInventorySection: React.FC<ProductInventorySectionProps> = ({
    units,
    hasAnyVariant,
    selectedUnit: propSelectedUnit
}) => {
    const { message } = App.useApp();
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

    const {
        selectedUnit: calculatedUnit,
        isDecimalAllowed,
        step,
        validateQuantity
    } = useUnit(unitType === 'custom' ? customUnit : saleUnitId, units);

    const effectiveUnit = propSelectedUnit || calculatedUnit;

    const rawDecimalFlag = (effectiveUnit?.is_decimal_stock ?? isDecimalAllowed) as any;
    const effectiveIsDecimalAllowed = rawDecimalFlag === true
        || rawDecimalFlag === 1
        || String(rawDecimalFlag).toLowerCase() === '1'
        || String(rawDecimalFlag).toLowerCase() === 'true';

    const effectiveStep = effectiveIsDecimalAllowed
        ? (Number(effectiveUnit?.step ?? step) || 0.1)
        : 1;

    const effectivePrecision = effectiveIsDecimalAllowed ? 2 : 0;

    const effectiveInputMode: "decimal" | "numeric" = effectiveIsDecimalAllowed ? 'decimal' : 'numeric';

    const globalStockSuffix = effectiveUnit?.stock_prefix
        || effectiveUnit?.suffix
        || effectiveUnit?.short_name
        || effectiveUnit?.label
        || effectiveUnit?.name;

    const stockSuffix = (
        showUnitPricing
            ? (
                unitType === 'custom'
                    ? (customUnit?.stock_prefix || customUnit?.suffix || customUnit?.label)
                    : globalStockSuffix
            )
            : globalStockSuffix
    ) || null;

    return (
        <SectionCard title={t('admin.product.form.tabs.inventory', 'Envanter')} id="inventory">
            <div style={{ color: "#64748b", marginBottom: 12 }}>
                {t('admin.product.form.inventory.desc', 'Envanter ve stok ayarlari bu bolumden yonetilir.')}
            </div>

            {isVariantManaged ? (
                <Alert
                    type="info"
                    showIcon
                    message={t('admin.product.form.variant_info_stock', 'Bu urunde varyant oldugu icin stok varyantlar uzerinden yonetilir. Lutfen stoklari varyantlardan duzenleyiniz.')}
                />
            ) : null}

            {!isVariantManaged ? (
                <Row gutter={24} align="middle">
                    <Col span={12}>
                        <Form.Item label={t('admin.product.form.qty.label', 'Stok')}>
                            <Space.Compact style={{ width: "100%", maxWidth: 180 }}>
                                <Form.Item name="qty" noStyle>
                                    <InputNumber
                                        style={{ width: "100%" }}
                                        min={effectiveUnit?.min || 0}
                                        step={effectiveStep}
                                        precision={effectivePrecision}
                                        inputMode={effectiveInputMode}
                                        controls={false}
                                        decimalSeparator="."
                                        parser={(value: any) => {
                                            if (!value) return "";
                                            const s = String(value).replace(/\s/g, "").replace(/,/g, ".");
                                            return s.replace(/[^0-9.\-]/g, "");
                                        }}
                                        formatter={(value) => value ? `${value}` : ''}
                                        onKeyDown={(e) => {
                                            const allowedKeys = ["Backspace", "Tab", "Enter", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
                                            if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || /^[0-9]$/.test(e.key)) return;
                                            if (
                                                effectiveIsDecimalAllowed
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
                                        onChange={(val) => {
                                            if (val !== null) {
                                                const validation = validateQuantity(val);
                                                if (!validation.valid) {
                                                    message.error(validation.error);
                                                    return;
                                                }
                                            }
                                            const allowBackorder = Boolean(form.getFieldValue('allow_backorder'));
                                            form.setFieldValue('in_stock', allowBackorder || Number(val ?? 0) > 0);
                                        }}
                                    />
                                </Form.Item>
                                {stockSuffix ? (
                                    <div style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderLeft: 'none',
                                        padding: '0 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#64748b'
                                    }}>
                                        {stockSuffix}
                                    </div>
                                ) : null}
                            </Space.Compact>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="allow_backorder" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    const qty = Number(form.getFieldValue('qty') ?? 0);
                                    form.setFieldValue('in_stock', checked || qty > 0);
                                }}
                            >
                                {t('admin.product.form.inventory.allow_backorder', 'Stokta yokken satisa devam et')}
                            </Checkbox>
                        </Form.Item>
                    </Col>
                </Row>
            ) : null}
        </SectionCard>
    );
};
