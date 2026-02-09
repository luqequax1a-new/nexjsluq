"use client";

import { useEffect } from 'react';
import { FormInstance } from 'antd';
import { t } from '@/lib/i18n';

interface UseProductFormEffectsProps {
    form: FormInstance;
    effectiveUnit: any;
    isDecimalAllowed: boolean;
    message: any;
}

export function useProductFormEffects({
    form,
    effectiveUnit,
    isDecimalAllowed,
    message
}: UseProductFormEffectsProps) {

    // 1. Manuel onValuesChange mantığı (Yan etkiler)
    const handleValuesChange = (changedValues: any) => {
        if (
            changedValues.hasOwnProperty('show_unit_pricing') ||
            changedValues.hasOwnProperty('unit_type') ||
            changedValues.hasOwnProperty('sale_unit_id') ||
            changedValues.hasOwnProperty('custom_unit')
        ) {
            // Edit sayfasında API'den gelen unit objesi (form.unit) sonraki seçimleri override etmesin.
            form.setFieldValue('unit' as any, null);
        }

        if (changedValues.hasOwnProperty("show_unit_pricing")) {
            if (!changedValues.show_unit_pricing) {
                form.setFieldsValue({
                    unit_type: null,
                    sale_unit_id: null,
                    custom_unit: undefined,
                });
            }
        }
        if (changedValues.hasOwnProperty("unit_type")) {
            if (changedValues.unit_type === "custom") {
                form.setFieldsValue({ sale_unit_id: null });
            }
        }
        if (changedValues.hasOwnProperty("discount_price")) {
            if (!changedValues.discount_price) {
                form.setFieldsValue({
                    discount_start: null,
                    discount_end: null,
                });
            }
        }
    };

    // 2. Birim değişiminde stok yuvarlama mantığı
    useEffect(() => {
        if (effectiveUnit && !isDecimalAllowed) {
            const currentQty = form.getFieldValue("qty");
            if (currentQty !== undefined && currentQty !== null && currentQty % 1 !== 0) {
                const rounded = Math.round(currentQty);
                form.setFieldValue("qty", rounded);
                message.warning(t('admin.product.form.unit.auto_rounded', 'Seçilen birim ondalık desteklemediği için stok miktarı yuvarlandı.'));
            }

            const currentVariants = form.getFieldValue("variants") || [];
            let variantRounded = false;
            const nextVariants = currentVariants.map((v: any) => {
                if (v.qty !== undefined && v.qty !== null && v.qty % 1 !== 0) {
                    variantRounded = true;
                    return { ...v, qty: Math.round(v.qty) };
                }
                return v;
            });
            if (variantRounded) {
                form.setFieldValue("variants", nextVariants);
            }
        }
    }, [effectiveUnit, isDecimalAllowed, form, message]);

    return { handleValuesChange };
}
