"use client";

import React, { useEffect, useRef } from 'react';
import { Form } from 'antd';
import { SectionCard } from '@/components/admin/SectionCard';
import { RichTextField } from '@/components/admin/RichTextField';
import { t } from '@/lib/i18n';

export const ProductDescriptionSection: React.FC = () => {
    const form = Form.useFormInstance();
    const hasInitialized = useRef(false);
    
    // Ensure form values are properly set for RichTextField components
    useEffect(() => {
        // Simple validation and sync without complex logic
        const shortDescription = form.getFieldValue('short_description');
        const description = form.getFieldValue('description');
        
        // Only update if values exist and are different from current
        if (shortDescription !== undefined || description !== undefined) {
            form.setFieldsValue({
                short_description: shortDescription || '',
                description: description || ''
            });
        }
    }, [form]);

    return (
        <SectionCard title={t('admin.product.form.tabs.details', 'Ürün Detayı')} id="details">
            <Form.Item
                name="short_description"
                label={t('admin.product.form.short_description.label', 'Kısa Açıklama')}
                shouldUpdate={false}
            >
                <RichTextField 
                    height={220} 
                    placeholder={t('admin.product.form.short_description.placeholder', 'Ürün liste sayfalarında görünecek kısa açıklama')} 
                />
            </Form.Item>
            <Form.Item
                name="description"
                label={t('admin.product.form.description.label', 'Ürün Açıklaması')}
                shouldUpdate={false}
            >
                <RichTextField 
                    height={420} 
                    placeholder={t('admin.product.form.description.placeholder', 'Ürün açıklaması yazın...')} 
                />
            </Form.Item>
        </SectionCard>
    );
};
