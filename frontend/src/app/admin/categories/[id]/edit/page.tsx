'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, App, Select, Radio, Space, Row, Col, Modal } from 'antd';
import { PlusOutlined, MinusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { getCategory, updateCategory, getCategories } from '@/lib/api/categories';
import { CategoryFormData, DynamicRule, Category } from '@/types/category';
import { getBrands } from '@/lib/api/brands';
import { Brand } from '@/types/brand';
import { usePageHeader } from '@/hooks/usePageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { RichTextField } from '@/components/admin/RichTextField';
import { SeoSection } from '@/components/admin/shared/SeoSection';
import { SingleImageSection } from '@/components/admin/shared/SingleImageSection';

export default function CategoryEditPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const params = useParams();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [categoryType, setCategoryType] = useState<'normal' | 'dynamic'>('normal');
    const [parentCategories, setParentCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

    const categoryName = Form.useWatch('name', form);

    useEffect(() => {
        fetchCategory();
        fetchParentCategories();
        fetchBrands();
    }, [params.id]);

    const fetchCategory = async () => {
        try {
            setFetching(true);
            const response = await getCategory(Number(params.id));
            const category = (response as any).category || response;
            setCurrentCategory(category);
            setCategoryType(category.type);

            const formData: any = {
                ...category,
            };

            if (category.type === 'dynamic' && category.dynamic_rule) {
                formData.match_type = category.dynamic_rule.match_type;
                formData.dynamic_rules = category.dynamic_rule.rules;
            }

            form.setFieldsValue(formData);
        } catch (error) {
            message.error('Kategori yüklenemedi');
        } finally {
            setFetching(false);
        }
    };

    const fetchParentCategories = async () => {
        try {
            const response = await getCategories({ type: 'normal', paginate: false });
            const allCategories = Array.isArray(response) ? response : (response as any).data || [];
            // Exclude current category and its descendants
            const filtered = allCategories.filter((cat: any) => cat.id !== Number(params.id));
            setParentCategories(filtered);
        } catch (error) {
            message.error('Kategoriler yüklenemedi');
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await getBrands({ paginate: false });
            setBrands(Array.isArray(response) ? response : response.brands || []);
        } catch (error) {
            console.error('Markalar yüklenemedi:', error);
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            const data: CategoryFormData = {
                ...values,
                type: categoryType,
            };

            if (categoryType === 'dynamic' && values.dynamic_rules) {
                data.dynamic_rule = {
                    match_type: values.match_type || 'all',
                    rules: values.dynamic_rules,
                };
                delete (data as any).dynamic_rules;
                delete (data as any).match_type;
            }

            await updateCategory(Number(params.id), data);
            message.success('Kategori güncellendi');
            router.push('/admin/categories');
        } catch (error: any) {
            message.error(error.message || 'İşlem başarısız');
        }
    };

    const save = async () => {
        try {
            setSaving(true);
            await form.validateFields();
            await handleSubmit(form.getFieldsValue());
        } catch (error) {
            // Validation error
        } finally {
            setSaving(false);
        }
    };

    const headerExtra = (
        <Button
            type="primary"
            onClick={() => save()}
            loading={saving}
            style={{
                height: 40,
                background: '#6f55ff',
                borderRadius: '8px',
                fontWeight: 600,
                padding: '0 20px',
                border: 'none',
                boxShadow: '0 2px 4px rgba(111, 85, 255, 0.2)'
            }}
        >
            Kaydet
        </Button>
    );

    usePageHeader({
        title: categoryName ? categoryName : 'Kategori Düzenle',
        variant: "dark",
        breadcrumb: [
            { label: "Katalog", href: "/admin/categories" },
            { label: "Kategoriler", href: "/admin/categories" }
        ],
        onBack: () => router.back(),
        extra: headerExtra
    });

    return (
        <div style={{ background: "transparent" }}>
            <div style={{ maxWidth: 1200, margin: '50px auto 0' }}>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ is_active: true, is_searchable: true, position: 0, match_type: 'all' }}
                >
                    <SectionCard title="Genel Bilgiler">
                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item label="Kategori Adı" name="name" rules={[{ required: true, message: 'Kategori adı zorunludur' }]}>
                                    <Input placeholder="Kategori adı" size="large" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Üst Kategori" name="parent_id">
                                    <Select
                                        placeholder="Üst kategori seçin"
                                        allowClear
                                        size="large"
                                        options={parentCategories
                                            .filter(cat => cat.id !== currentCategory?.id)
                                            .map(cat => ({
                                                label: cat.name,
                                                value: cat.id
                                            }))}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item label="Açıklama" name="description">
                                    <RichTextField
                                        height={300}
                                        placeholder="Kategori açıklaması (HTML destekli)"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </SectionCard>

                    <SectionCard title="Medya">
                        <SingleImageSection fieldName="image" label="Kategori Görseli" />
                    </SectionCard>

                    <SectionCard title="SSS (FAQ)">
                        <Form.List name="faq_items">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <div key={key} style={{ marginBottom: 16, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'question']}
                                                label="Soru"
                                                rules={[{ required: true, message: 'Soru zorunludur' }]}
                                            >
                                                <Input placeholder="Soru girin" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'answer']}
                                                label="Cevap"
                                                rules={[{ required: true, message: 'Cevap zorunludur' }]}
                                            >
                                                <Input.TextArea rows={3} placeholder="Cevap girin" />
                                            </Form.Item>
                                            <Button type="link" danger onClick={() => remove(name)}>
                                                Kaldır
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        SSS Ekle
                                    </Button>
                                </>
                            )}
                        </Form.List>
                    </SectionCard>

                    {categoryType === 'dynamic' && (
                        <SectionCard title="Koşullar">
                            <Form.Item label="Koşul Mantığı" name="match_type">
                                <Radio.Group>
                                    <Radio value="all">Tüm Koşulları Sağlamalı (AND)</Radio>
                                    <Radio value="any">En Az Bir Koşulu Sağlamalı (OR)</Radio>
                                </Radio.Group>
                            </Form.Item>

                            <div style={{ borderTop: '1px solid #f0f0f0', margin: '24px 0' }} />

                            <Form.List name="dynamic_rules">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'condition']}
                                                    rules={[{ required: true, message: 'Koşul seçin' }]}
                                                >
                                                    <Select placeholder="Koşul" style={{ width: 150 }}>
                                                        <Select.Option value="brand">Ürün Markası</Select.Option>
                                                        <Select.Option value="price">Ürün Fiyatı</Select.Option>
                                                        <Select.Option value="tag">Ürün Etiketi</Select.Option>
                                                        <Select.Option value="discount">İndirimli Ürünler</Select.Option>
                                                        <Select.Option value="stock">Stok Durumu</Select.Option>
                                                    </Select>
                                                </Form.Item>

                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'method']}
                                                    rules={[{ required: true, message: 'Metot seçin' }]}
                                                >
                                                    <Select placeholder="Metot" style={{ width: 120 }}>
                                                        <Select.Option value="contains">İçeren</Select.Option>
                                                        <Select.Option value="not_contains">İçermeyen</Select.Option>
                                                    </Select>
                                                </Form.Item>

                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'values']}
                                                    rules={[{ required: true, message: 'Değer girin' }]}
                                                >
                                                    <Input placeholder="Değerler" style={{ width: 200 }} />
                                                </Form.Item>

                                                <MinusCircleOutlined onClick={() => remove(name)} />
                                            </Space>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                Koşul Ekle
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </SectionCard>
                    )}

                    <SectionCard title="SEO Ayarları">
                        <SeoSection entityType="category" />
                    </SectionCard>
                </Form>
            </div>
        </div>
    );
}
