'use client';

import { Form, InputNumber, Switch, Input, Row, Col, Space, ColorPicker, Alert, Select } from 'antd';
import { SectionCard } from '@/components/admin/SectionCard';
import type { FormInstance } from 'antd';
import type { Color } from 'antd/es/color-picker';

interface DisplaySettingsPanelProps {
    form: FormInstance;
}

export function DisplaySettingsPanel({ form }: DisplaySettingsPanelProps) {
    const countdownEnabled = Form.useWatch(['display_config', 'countdown_enabled'], form);

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
                message="Görünüm Ayarları"
                description="Teklifin müşteriye nasıl gösterileceğini özelleştirin. Bu ayarlar modal/popup görünümünü etkiler."
                type="info"
                showIcon
            />

            <SectionCard title="Geri Sayım Sayacı">
                <Form.Item
                    name={['display_config', 'countdown_enabled']}
                    label="Geri sayım sayacı göster"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>

                {countdownEnabled && (
                    <Form.Item
                        name={['display_config', 'countdown_minutes']}
                        label="Geri Sayım Süresi (Dakika)"
                        rules={[{ required: true, message: 'Süre gerekli' }]}
                    >
                        <InputNumber
                            min={1}
                            max={60}
                            placeholder="5"
                            suffix="dakika"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                )}
            </SectionCard>

            <SectionCard title="Badge ve Etiket">
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name={['display_config', 'badge_text']}
                            label="Badge Metni"
                            tooltip="Örn: 'ÖNERİLEN', 'ÖZEL TEKLİF'"
                        >
                            <Input placeholder="Örn: ÖZEL TEKLİF" maxLength={20} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name={['display_config', 'badge_color']}
                            label="Badge Rengi"
                        >
                            <ColorPicker
                                showText
                                format="hex"
                                onChange={(color: Color) => {
                                    form.setFieldValue(
                                        ['display_config', 'badge_color'],
                                        color.toHexString()
                                    );
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </SectionCard>

            <SectionCard title="Modal Ayarları">
                <Form.Item
                    name={['display_config', 'modal_size']}
                    label="Modal Boyutu"
                >
                    <Select
                        placeholder="Orta"
                        style={{ width: '100%' }}
                        options={[
                            { value: 'small', label: 'Küçük' },
                            { value: 'medium', label: 'Orta' },
                            { value: 'large', label: 'Büyük' },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    name={['display_config', 'show_product_image']}
                    label="Ürün görselini göster"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>

                <Form.Item
                    name={['display_config', 'show_original_price']}
                    label="Orijinal fiyatı üstü çizili göster"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>

                <Form.Item
                    name={['display_config', 'auto_close_on_add']}
                    label="Sepete eklenince otomatik kapat"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>
            </SectionCard>

            <SectionCard title="Buton Metinleri">
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name={['display_config', 'accept_button_text']}
                            label="Kabul Butonu Metni (TR)"
                        >
                            <Input placeholder="Sepete Ekle" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name={['display_config', 'reject_button_text']}
                            label="Red Butonu Metni (TR)"
                        >
                            <Input placeholder="Hayır, Teşekkürler" />
                        </Form.Item>
                    </Col>
                </Row>
            </SectionCard>
        </Space>
    );
}
