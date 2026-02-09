"use client";

import { Row, Col, Form, Input, Checkbox, Alert } from "antd";
import React, { useRef, useCallback, useState, useEffect } from "react";
import { APP_CONFIG } from "@/config/app";
import { ArrowRight } from "lucide-react";

// Turkish character conversion for slug generation
function generateSlug(text: string): string {
    if (!text) return '';

    return text
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
}

interface SeoSectionProps {
    entityType: 'product' | 'category' | 'brand' | 'page';
    nameFieldName?: string;
}

const SeoPreview = ({ name, slug, title, desc, labels }: any) => {
    const hasData = name || slug || title || desc;

    if (!hasData) {
        return (
            <div style={{ textAlign: "center", color: "#8c8c8c" }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    Henüz önizlemeniz görünmüyor
                </div>
                <div style={{ fontSize: 12 }}>
                    Önizleme için bilgi girmeniz gerekmektedir.
                </div>
            </div>
        );
    }

    const displayTitle = title || name || `${labels.singular} Adı`;
    const displayDesc = desc || labels.placeholder;
    const displayUrl = labels.path
        ? `${APP_CONFIG.url}/${labels.path}/${slug || ""}`
        : `${APP_CONFIG.url}/${slug || ""}`;

    return (
        <div style={{ fontFamily: "arial, sans-serif" }}>
            <div style={{ fontSize: 18, color: "#1a0dab", lineHeight: "1.2", marginBottom: 2, cursor: "pointer" }}>
                {displayTitle}
            </div>
            <div style={{ fontSize: 14, color: "#006621", marginBottom: 2 }}>
                {displayUrl}
            </div>
            <div style={{ fontSize: 13, color: "#545454", lineHeight: "1.4" }}>
                {displayDesc}
            </div>
        </div>
    );
};

export function SeoSection({ entityType, nameFieldName = 'name' }: SeoSectionProps) {
    const form = Form.useFormInstance();
    const manuallyEditedRef = useRef(false);
    const [slugChanged, setSlugChanged] = useState(false);
    const [originalSlug, setOriginalSlug] = useState<string>('');

    // Get product ID to check if we're in edit mode
    const productId = form.getFieldValue('id');
    const isEditMode = !!productId;

    const entityLabels = {
        product: { singular: 'Ürün', path: 'urun', placeholder: 'Ürün açıklaması burada görünecek...' },
        category: { singular: 'Kategori', path: 'kategori', placeholder: 'Kategori açıklaması burada görünecek...' },
        brand: { singular: 'Marka', path: 'marka', placeholder: 'Marka açıklaması burada görünecek...' },
        page: { singular: 'Sayfa', path: '', placeholder: 'Sayfa açıklaması burada görünecek...' }
    };

    const labels = entityLabels[entityType];

    const nameValue = Form.useWatch(nameFieldName, form);
    const slugValue = Form.useWatch('slug', form);
    const metaTitle = Form.useWatch('meta_title', form);
    const metaDesc = Form.useWatch('meta_description', form);

    // Store original slug on mount (only in edit mode)
    useEffect(() => {
        if (isEditMode && slugValue && !originalSlug) {
            setOriginalSlug(slugValue);
        }
    }, [isEditMode, slugValue, originalSlug]);

    // Detect slug changes
    useEffect(() => {
        if (isEditMode && originalSlug && slugValue && slugValue !== originalSlug) {
            setSlugChanged(true);
        } else {
            setSlugChanged(false);
        }
    }, [isEditMode, originalSlug, slugValue]);

    return (
        <Row gutter={24}>
            <Col span={12}>
                <Form.Item
                    name="slug"
                    label="Slug"
                >
                    <Input
                        prefix="/"
                        placeholder="url-slug"
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                                manuallyEditedRef.current = true;
                            } else {
                                manuallyEditedRef.current = false;
                                if (nameValue) {
                                    setTimeout(() => {
                                        form.setFieldValue('slug', generateSlug(nameValue));
                                    }, 0);
                                }
                            }
                        }}
                    />
                </Form.Item>
                <div style={{ marginTop: -12, marginBottom: 16, fontSize: 12, color: '#64748b' }}>
                    URL'nin son kısmı. Benzersiz olmalıdır.
                </div>

                {slugChanged && isEditMode && entityType === 'product' && (
                    <>
                        <Alert
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                            message={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <span>Değiştirdiğiniz URL'yi otomatik olarak yeni URL'e 301 ile yönlendir.</span>
                                </div>
                            }
                        />
                        <Form.Item name="create_redirect_on_slug_change" valuePropName="checked" style={{ marginBottom: 8, marginTop: -8 }}>
                            <Checkbox>
                                <span style={{ color: '#0891b2', fontWeight: 500 }}>
                                    {originalSlug} → {slugValue}
                                </span>
                            </Checkbox>
                        </Form.Item>
                    </>
                )}

                <Form.Item name="meta_title" label="Sayfa Başlığı">
                    <Input showCount maxLength={70} placeholder="Meta Başlığı" />
                </Form.Item>
                <Form.Item name="meta_description" label="Açıklama">
                    <Input.TextArea showCount maxLength={320} rows={4} placeholder="Meta Açıklaması" />
                </Form.Item>
            </Col>
            <Col span={12} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ background: "#f8fafc", padding: 20, borderRadius: 8, border: "1px solid #e2e8f0", minHeight: 160, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <SeoPreview
                        name={nameValue}
                        slug={slugValue}
                        title={metaTitle}
                        desc={metaDesc}
                        labels={labels}
                    />
                </div>
                <div style={{ marginTop: 16, color: "#64748b", fontSize: 12 }}>
                    Bu, arama sonuçlarında nasıl görünebileceğinin bir önizlemesidir.
                </div>
            </Col>
        </Row>
    );
}
