'use client';

import { useState, useEffect } from 'react';
import { Form, Select, TreeSelect, InputNumber, Row, Col, Alert } from 'antd';
import { apiFetch } from '@/lib/api';
import type { FormInstance } from 'antd';

interface TriggerSelectorProps {
    form: FormInstance;
}

export function TriggerSelector({ form }: TriggerSelectorProps) {
    const [triggerType, setTriggerType] = useState('all_products');
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const subscription = form.getFieldValue('trigger_type');
        setTriggerType(subscription || 'all_products');
    }, [form]);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await apiFetch<any>('/api/products?per_page=1000');
            setProducts(data.data || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await apiFetch<any>('/api/categories-tree');
            setCategories(data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const buildCategoryTree = (categories: any[]): any[] => {
        return categories.map((cat) => ({
            title: cat.name,
            value: cat.id,
            children: cat.children ? buildCategoryTree(cat.children) : undefined,
        }));
    };

    return (
        <>
            <Form.Item
                name="trigger_type"
                label="Teklif Ne Zaman Tetiklensin?"
                rules={[{ required: true, message: 'Tetikleyici seçimi gerekli' }]}
                initialValue="all_products"
            >
                <Select onChange={(value) => setTriggerType(value)}>
                    <Select.Option value="all_products">
                        🌐 Tüm Ürünler (Her Sepet İçin)
                    </Select.Option>
                    <Select.Option value="specific_products">
                        📦 Belirli Ürünler Sepette Olduğunda
                    </Select.Option>
                    <Select.Option value="specific_categories">
                        📂 Belirli Kategorilerden Ürün Olduğunda
                    </Select.Option>
                    <Select.Option value="cart_total">
                        💰 Sepet Tutarı Belirli Aralıkta Olduğunda
                    </Select.Option>
                </Select>
            </Form.Item>

            {triggerType === 'specific_products' && (
                <Form.Item
                    name={['trigger_config', 'product_ids']}
                    label="Tetikleyici Ürünler"
                    rules={[{ required: true, message: 'En az 1 ürün seçmelisiniz' }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Ürünleri seçin..."
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={products.map((p) => ({
                            value: p.id,
                            label: `${p.name} (${p.sku})`,
                        }))}
                    />
                </Form.Item>
            )}

            {triggerType === 'specific_categories' && (
                <Form.Item
                    name={['trigger_config', 'category_ids']}
                    label="Tetikleyici Kategoriler"
                    rules={[{ required: true, message: 'En az 1 kategori seçmelisiniz' }]}
                >
                    <TreeSelect
                        multiple
                        treeData={buildCategoryTree(categories)}
                        placeholder="Kategorileri seçin..."
                        treeDefaultExpandAll
                        showSearch
                        treeNodeFilterProp="title"
                    />
                </Form.Item>
            )}

            {triggerType === 'cart_total' && (
                <>
                    <Alert
                        message="Sepet tutarı belirtilen aralıkta olduğunda teklif gösterilecek"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name={['trigger_config', 'min_total']}
                                label="Minimum Sepet Tutarı (₺)"
                                rules={[{ required: true, message: 'Minimum tutar gerekli' }]}
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    placeholder="0.00"
                                    precision={2}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name={['trigger_config', 'max_total']}
                                label="Maksimum Sepet Tutarı (₺)"
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    placeholder="Sınırsız"
                                    precision={2}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </>
            )}
        </>
    );
}
