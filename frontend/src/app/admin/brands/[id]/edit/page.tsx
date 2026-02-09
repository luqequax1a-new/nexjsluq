'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Row, Col } from 'antd';
import { useRouter, useParams } from 'next/navigation';
import { getBrand, updateBrand } from '@/lib/api/brands';
import { BrandFormData } from '@/types/brand';
import { usePageHeader } from '@/hooks/usePageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { SeoSection } from '@/components/admin/shared/SeoSection';
import { SingleImageSection } from '@/components/admin/shared/SingleImageSection';

export default function BrandEditPage() {
    const router = useRouter();
    const params = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        fetchBrand();
    }, [params.id]);

    const fetchBrand = async () => {
        try {
            setFetching(true);
            const response = await getBrand(Number(params.id));
            const brand = response.brand || response;
            form.setFieldsValue(brand);
        } catch (error) {
            console.error('Marka yüklenemedi:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (values: BrandFormData) => {
        try {
            setLoading(true);
            await updateBrand(Number(params.id), values);
            router.push('/admin/brands');
        } catch (error: any) {
        } finally {
            setLoading(false);
        }
    };

    const save = async () => {
        try {
            await form.validateFields();
            await handleSubmit(form.getFieldsValue());
        } catch (error) {
            // Validation error
        }
    };

    usePageHeader({
        title: "Markayı Düzenle",
        variant: "dark",
        breadcrumb: [
            { label: "Katalog", href: "/admin/brands" },
            { label: "Markalar", href: "/admin/brands" }
        ],
        onBack: () => router.back(),
        onSave: save,
        saving: loading,
    });

    return (
        <div style={{ background: "transparent" }}>
            <div style={{ maxWidth: 1200, margin: '50px auto 0' }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ image: '' }}
                >
                    <SectionCard title="Genel Bilgiler">
                        <Form.Item 
                            name="name" 
                            label="Marka Adı"
                            rules={[{ required: true, message: 'Marka adı zorunludur' }]}
                        >
                            <Input placeholder="Marka adı" size="large" />
                        </Form.Item>
                    </SectionCard>

                    <SectionCard title="Medya">
                        <SingleImageSection fieldName="image" label="Marka Görseli" />
                    </SectionCard>

                    <SectionCard title="SEO Ayarları">
                        <SeoSection entityType="brand" />
                    </SectionCard>
                </Form>
            </div>
        </div>
    );
}
