"use client";

import { Form, Input, InputNumber, Space, Switch, Card, Row, Col } from "antd";
import { useEffect } from "react";

interface UnitFormProps {
    id?: string;
    initialValues?: any;
    onSave: (values: any) => Promise<void>;
    loading?: boolean;
}

export function UnitForm({ id, initialValues, onSave, loading }: UnitFormProps) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (initialValues) {
            // Parse decimal strings to actual numbers to avoid trailing zeros in InputNumber
            const formattedValues = { ...initialValues };
            ['min', 'max', 'step', 'default_qty'].forEach(key => {
                if (formattedValues[key] !== null && formattedValues[key] !== undefined) {
                    const num = Number(formattedValues[key]);
                    if (!isNaN(num)) formattedValues[key] = num;
                }
            });
            form.setFieldsValue(formattedValues);
        } else {
            form.setFieldsValue({
                min: 0,
                step: 1,
                is_decimal_stock: false,
                is_active: true
            });
        }
    }, [initialValues, form]);

    return (
        <Form
            id={id}
            form={form}
            layout="vertical"
            onFinish={onSave}
            style={{ width: "100%" }}
        >
            <Row gutter={24}>
                <Col span={16}>
                    <Card title="Genel" variant="borderless" style={{ marginBottom: 24 }}>
                        <Form.Item name="name" label="Ad *" rules={[{ required: true, message: "Ad zorunludur" }]}>
                            <Input placeholder="Örn: Kilogram" size="large" />
                        </Form.Item>
                        <Form.Item name="label" label="Etiket">
                            <Input placeholder="Örn: Ağırlık" size="large" />
                        </Form.Item>
                    </Card>

                    <Card title="Miktar Ayarları" variant="borderless" style={{ marginBottom: 24 }}>
                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item name="min" label="Minimum Miktar">
                                    <InputNumber style={{ width: "100%" }} min={0} size="large" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="max" label="Maksimum Miktar">
                                    <InputNumber style={{ width: "100%" }} min={0} size="large" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item name="step" label="Artış Adımı (Step)">
                                    <InputNumber style={{ width: "100%" }} min={0} step={0.1} size="large" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="default_qty" label="Varsayılan Miktar">
                                    <InputNumber style={{ width: "100%" }} min={0} step={0.1} size="large" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card title="Prefix Ayarları" variant="borderless">
                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item name="quantity_prefix" label="Miktar Prefix">
                                    <Input placeholder="Örn: Adet" size="large" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="price_prefix" label="Fiyat Prefix">
                                    <Input placeholder="Örn: /" size="large" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="stock_prefix" label="Stok Prefix">
                                    <Input placeholder="Örn: /" size="large" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                <Col span={8}>
                    <Card title="Durum" variant="borderless" style={{ marginBottom: 24 }}>
                        <Form.Item name="is_active" label="Aktif" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="is_decimal_stock" label="Ondalık Stok" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Card>

                    <Card title="Ek Bilgiler" variant="borderless">
                        <Form.Item name="info_top" label="Üst Bilgi">
                            <Input.TextArea rows={4} placeholder="Ürün sayfasında üstte görünecek bilgi" />
                        </Form.Item>
                        <Form.Item name="info_bottom" label="Alt Bilgi">
                            <Input.TextArea rows={4} placeholder="Ürün sayfasında altta görünecek bilgi" />
                        </Form.Item>
                    </Card>
                </Col>
            </Row>
        </Form>
    );
}
