'use client';

import { Form, InputNumber, Switch, Row, Col, Alert, Space } from 'antd';
import { SectionCard } from '@/components/admin/SectionCard';
import type { FormInstance } from 'antd';

interface ConditionsPanelProps {
    form: FormInstance;
}

export function ConditionsPanel({ form }: ConditionsPanelProps) {
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
                message="Koşullar"
                description="Teklifin gösterilmesi için ek koşullar belirleyin. Tüm koşullar sağlandığında teklif müşteriye sunulur."
                type="info"
                showIcon
            />

            <SectionCard title="Sepet Koşulları">
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name={['conditions', 'min_cart_total']}
                            label="Minimum Sepet Tutarı (₺)"
                            tooltip="Sepet bu tutarın altındaysa teklif gösterilmez"
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                placeholder="Sınır yok"
                                precision={2}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name={['conditions', 'max_cart_total']}
                            label="Maksimum Sepet Tutarı (₺)"
                            tooltip="Sepet bu tutarın üstündeyse teklif gösterilmez"
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                placeholder="Sınır yok"
                                precision={2}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name={['conditions', 'min_items_count']}
                            label="Minimum Ürün Adedi"
                            tooltip="Sepette en az bu kadar ürün olmalı"
                        >
                            <InputNumber
                                min={1}
                                style={{ width: '100%' }}
                                placeholder="Sınır yok"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name={['conditions', 'max_items_count']}
                            label="Maksimum Ürün Adedi"
                            tooltip="Sepette en fazla bu kadar ürün olmalı"
                        >
                            <InputNumber
                                min={1}
                                style={{ width: '100%' }}
                                placeholder="Sınır yok"
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </SectionCard>

            <SectionCard title="Ürün Koşulları">
                <Form.Item
                    name={['conditions', 'exclude_discounted']}
                    valuePropName="checked"
                    initialValue={false}
                >
                    <Space>
                        <Switch />
                        <span>İndirimli ürünler sepette varsa teklifi gösterme</span>
                    </Space>
                </Form.Item>

                <Form.Item
                    name={['conditions', 'hide_if_in_cart']}
                    valuePropName="checked"
                    initialValue={true}
                >
                    <Space>
                        <Switch />
                        <span>Teklif ürünü zaten sepetteyse teklifi gösterme</span>
                    </Space>
                </Form.Item>
            </SectionCard>

            <SectionCard title="Müşteri Koşulları">
                <Form.Item
                    name={['conditions', 'first_order_only']}
                    valuePropName="checked"
                    initialValue={false}
                >
                    <Space>
                        <Switch />
                        <span>Sadece ilk siparişte göster</span>
                    </Space>
                </Form.Item>

                <Form.Item
                    name={['conditions', 'logged_in_only']}
                    valuePropName="checked"
                    initialValue={false}
                >
                    <Space>
                        <Switch />
                        <span>Sadece üye müşterilere göster</span>
                    </Space>
                </Form.Item>
            </SectionCard>
        </Space>
    );
}
