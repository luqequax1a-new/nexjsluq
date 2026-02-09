"use client";

import { SectionCard } from "@/components/admin/SectionCard";
import { usePageHeader } from "@/hooks/usePageHeader";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { App, Form, Button, Input, Select, Switch, Row, Col, Divider, Typography } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from "@ant-design/icons";
import { useState, useMemo } from "react";
import { t } from "@/lib/i18n";

const { TextArea } = Input;

export default function NewCustomerPage() {
    const router = useRouter();
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    const save = async () => {
        try {
            await form.validateFields();
            setSaving(true);
            const values = form.getFieldsValue();

            await apiFetch("/api/customers", {
                method: "POST",
                json: values,
            });

            message.success("Müşteri başarıyla oluşturuldu");
            router.push("/admin/customers");
        } catch (e: any) {
            if (e.errorFields) return;
            message.error(e?.message || "Kayıt sırasında hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    const breadcrumb = useMemo(() => [
        { label: "Müşteriler", href: "/admin/customers" },
        { label: "Yeni Müşteri" }
    ], []);

    const headerExtra = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        </div>
    );

    usePageHeader({
        title: "Yeni Müşteri",
        variant: "dark",
        breadcrumb,
        onBack: () => router.push('/admin/customers'),
        extra: headerExtra
    });

    return (
        <div id="admin-focus-content" style={{ width: "100%", paddingBottom: 100, height: '100%', overflowY: 'auto' }}>
            <Form
                form={form}
                layout="vertical"
                style={{ width: "100%" }}
                initialValues={{
                    is_active: true,
                    accepts_marketing: false,
                    group: 'normal'
                }}
            >
                <div style={{ maxWidth: "clamp(600px, 90vw, 1200px)", margin: "0 auto", padding: "clamp(20px, 4vw, 40px) 24px 0 24px" }}>

                    {/* General Information */}
                    <SectionCard title="Genel Bilgiler" icon={<UserOutlined />} id="general">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Ad"
                                    name="first_name"
                                    rules={[{ required: true, message: 'Ad zorunludur' }]}
                                >
                                    <Input prefix={<UserOutlined />} placeholder="Ad" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Soyad"
                                    name="last_name"
                                    rules={[{ required: true, message: 'Soyad zorunludur' }]}
                                >
                                    <Input prefix={<UserOutlined />} placeholder="Soyad" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="E-posta"
                                    name="email"
                                    rules={[
                                        { required: true, message: 'E-posta zorunludur' },
                                        { type: 'email', message: 'Geçerli bir e-posta adresi girin' }
                                    ]}
                                >
                                    <Input prefix={<MailOutlined />} placeholder="ornek@email.com" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Telefon"
                                    name="phone"
                                >
                                    <Input prefix={<PhoneOutlined />} placeholder="+90 555 123 4567" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="TC Kimlik No"
                                    name="national_id"
                                >
                                    <Input prefix={<IdcardOutlined />} placeholder="12345678901" maxLength={11} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Müşteri Grubu"
                                    name="group"
                                >
                                    <Select>
                                        <Select.Option value="normal">Normal</Select.Option>
                                        <Select.Option value="vip">VIP</Select.Option>
                                        <Select.Option value="wholesale">Toptan</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Notlar"
                            name="notes"
                        >
                            <TextArea rows={4} placeholder="Müşteri hakkında notlar..." />
                        </Form.Item>

                        <Divider />

                        <Form.Item
                            label="Pazarlama E-postaları"
                            name="accepts_marketing"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Evet" unCheckedChildren="Hayır" />
                        </Form.Item>
                    </SectionCard>

                </div>
            </Form>
        </div>
    );
}
