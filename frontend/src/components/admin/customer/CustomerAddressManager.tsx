"use client";

import React, { useState, useEffect } from "react";
import {
    App,
    Button,
    Card,
    Empty,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Tag,
    Typography,
    Row,
    Col,
    Switch,
    Popconfirm,
    Divider,
    Radio
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EnvironmentOutlined,
    HomeOutlined,
    PushpinOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import { TURKEY_PROVINCES, TURKEY_DISTRICTS } from "@/lib/turkey-locations";
import type { CustomerAddress } from "@/types/order";

const { Text, Title } = Typography;

interface CustomerAddressManagerProps {
    customerId: number;
    addresses?: CustomerAddress[];
    onRefresh: () => void;
}

export function CustomerAddressManager({ customerId, addresses = [], onRefresh }: CustomerAddressManagerProps) {
    const { message } = App.useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    // Dynamic cities/districts logic
    const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

    const handleAdd = () => {
        setEditingAddress(null);
        form.resetFields();
        form.setFieldsValue({
            country: "TR",
            type: "individual",
            is_default_billing: addresses.length === 0,
            is_default_shipping: addresses.length === 0,
        });
        setSelectedProvince(null);
        setIsModalOpen(true);
    };

    const handleEdit = (address: CustomerAddress) => {
        setEditingAddress(address);
        form.setFieldsValue({
            id: address.id,
            title: address.title ?? null,
            type: address.type ?? 'individual',
            first_name: address.first_name ?? null,
            last_name: address.last_name ?? null,
            company: address.company ?? null,
            tax_office: address.tax_office ?? null,
            tax_number: address.tax_number ?? null,
            phone: address.phone ?? null,
            country: address.country ?? 'TR',
            city: address.city ?? null,
            state: address.state ?? null,
            postal_code: address.postal_code ?? null,
            address_line_1: address.address_line_1 ?? null,
            address_line_2: (address as any).address_line_2 ?? null,
            is_default_billing: Boolean((address as any).is_default_billing),
            is_default_shipping: Boolean((address as any).is_default_shipping),
        });
        setSelectedProvince(address.city);
        setIsModalOpen(true);
    };

    const handleSave = async (values: any) => {
        setSaving(true);
        try {
            if (editingAddress) {
                await apiFetch(`/api/customers/${customerId}/addresses/${editingAddress.id}`, {
                    method: "PUT",
                    json: values,
                });
                message.success(t("admin.customers.address.update_success", "Adres güncellendi"));
            } else {
                await apiFetch(`/api/customers/${customerId}/addresses`, {
                    method: "POST",
                    json: values,
                });
                message.success(t("admin.customers.address.create_success", "Adres eklendi"));
            }
            setIsModalOpen(false);
            onRefresh();
        } catch (e: any) {
            message.error(e.message || t("admin.common.error", "Bir hata oluştu"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (addressId: number) => {
        try {
            await apiFetch(`/api/customers/${customerId}/addresses/${addressId}`, {
                method: "DELETE",
            });
            message.success(t("admin.customers.address.delete_success", "Adres silindi"));
            onRefresh();
        } catch (e: any) {
            message.error(e.message || t("admin.common.error", "Bir hata oluştu"));
        }
    };

    const districts = selectedProvince ? TURKEY_DISTRICTS[selectedProvince] || [] : [];

    return (
        <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0 }}>
                    <EnvironmentOutlined style={{ marginRight: 8, color: "#6366f1" }} />
                    {t("admin.customers.address.title", "Adres Yönetimi")}
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={handleAdd}
                    style={{ borderRadius: 6, background: "#6366f1", borderColor: "#6366f1" }}
                >
                    {t("admin.customers.address.add_new", "Yeni Adres")}
                </Button>
            </div>

            {addresses.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t("admin.customers.address.empty", "Henüz bir adres eklenmemiş")}
                    style={{ padding: '24px 0' }}
                />
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {addresses.map((addr) => (
                        <Card
                            key={addr.id}
                            size="small"
                            style={{
                                borderRadius: 10,
                                border: (addr.is_default_billing || addr.is_default_shipping) ? "1.5px solid #e0e7ff" : "1px solid #f1f5f9",
                                background: (addr.is_default_billing || addr.is_default_shipping) ? "#fcfdff" : "#ffffff"
                            }}
                            className="address-item-card"
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <Text strong>{addr.title || t("admin.customers.address.default_title", "Adres")}</Text>
                                        <Space size={4}>
                                            {addr.is_default_shipping && (
                                                <Tag color="blue" bordered={false} style={{ fontSize: 10, borderRadius: 4 }}>
                                                    {t("admin.customers.address.shipping", "Teslimat")}
                                                </Tag>
                                            )}
                                            {addr.is_default_billing && (
                                                <Tag color="cyan" bordered={false} style={{ fontSize: 10, borderRadius: 4 }}>
                                                    {t("admin.customers.address.billing", "Fatura")}
                                                </Tag>
                                            )}
                                            {addr.type === 'corporate' && (
                                                <Tag color="purple" bordered={false} style={{ fontSize: 10, borderRadius: 4 }}>
                                                    {t("admin.customers.address.form.corporate_badge", "Kurumsal")}
                                                </Tag>
                                            )}
                                        </Space>
                                    </div>
                                    <Text style={{ display: "block", fontSize: 13, color: "#1e293b", fontWeight: 500 }}>
                                        {addr.first_name} {addr.last_name}
                                    </Text>
                                    {addr.type === 'corporate' && addr.company && (
                                        <Text style={{ display: "block", fontSize: 12, color: "#475569", fontWeight: 600 }}>
                                            {addr.company}
                                        </Text>
                                    )}
                                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 2, lineHeight: 1.4 }}>
                                        {addr.address_line_1}
                                        <br />
                                        {addr.state ? `${addr.state} / ` : ""}{addr.city}
                                    </Text>
                                    {addr.phone && (
                                        <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                                            {addr.phone}
                                        </Text>
                                    )}
                                </div>
                                <Space direction="vertical" size={4} align="end">
                                    <Button
                                        type="text"
                                        icon={<EditOutlined style={{ color: "#6366f1" }} />}
                                        size="small"
                                        onClick={() => handleEdit(addr)}
                                    />
                                    <Popconfirm
                                        title={t("admin.common.confirm_delete", "Silmek istediğinize emin misiniz?")}
                                        onConfirm={() => handleDelete(addr.id)}
                                        okText={t("admin.common.yes", "Evet")}
                                        cancelText={t("admin.common.cancel", "İptal")}
                                        okType="danger"
                                    >
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            size="small"
                                        />
                                    </Popconfirm>
                                </Space>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                title={editingAddress ? t("admin.customers.address.edit", "Adresi Düzenle") : t("admin.customers.address.add", "Yeni Adres Ekle")}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={saving}
                width={520}
                okText={t("admin.common.save", "Kaydet")}
                cancelText={t("admin.common.cancel", "İptal")}
                style={{ top: 40 }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    initialValues={{ type: 'individual', country: 'TR' }}
                >
                    <Form.Item name="title" label={t("admin.customers.address.form.title", "Adres Başlığı")} rules={[{ required: true }]}>
                        <Input placeholder={t("admin.customers.address.form.title_placeholder", "Örn: Ev, İş, Fatura Adresim")} />
                    </Form.Item>

                    <div style={{ marginBottom: 20, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                        <Form.Item name="type" label={t("admin.customers.address.form.type", "Fatura Tipi")} noStyle>
                            <Radio.Group style={{ width: '100%' }} optionType="button" buttonStyle="solid">
                                <Radio.Button value="individual" style={{ width: '50%', textAlign: 'center' }}>{t("admin.customers.address.form.individual", "Bireysel")}</Radio.Button>
                                <Radio.Button value="corporate" style={{ width: '50%', textAlign: 'center' }}>{t("admin.customers.address.form.corporate", "Kurumsal")}</Radio.Button>
                            </Radio.Group>
                        </Form.Item>
                    </div>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="first_name" label={t("admin.common.first_name", "Ad")} rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="last_name" label={t("admin.common.last_name", "Soyad")} rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
                        {({ getFieldValue }) => {
                            const type = getFieldValue('type');
                            if (type === 'corporate') {
                                return (
                                    <div style={{ animation: 'fadeIn 0.3s' }}>
                                        <Form.Item name="company" label={t("admin.common.company", "Şirket Adı")} rules={[{ required: true }]}>
                                            <Input placeholder={t("admin.common.company_placeholder", "Şahıs şirketi veya firma adı")} />
                                        </Form.Item>
                                        <Row gutter={12}>
                                            <Col span={12}>
                                                <Form.Item name="tax_office" label={t("admin.customers.address.form.tax_office", "Vergi Dairesi")} rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="tax_number" label={t("admin.customers.address.form.tax_number", "Vergi No")} rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                );
                            }
                            return (
                                <Form.Item name="tax_number" label={t("admin.customers.address.form.national_id", "TC Kimlik No")}>
                                    <Input placeholder={t("admin.customers.address.form.national_id_placeholder", "Faturalandırma için opsiyonel")} />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="phone" label={t("admin.common.phone", "Telefon")} rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="city" label={t("admin.customers.address.form.city", "İl")} rules={[{ required: true }]}>
                                <Select
                                    showSearch
                                    onChange={(v) => {
                                        setSelectedProvince(v);
                                        form.setFieldValue("state", undefined);
                                    }}
                                    options={TURKEY_PROVINCES.map(p => ({ label: p, value: p }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="state" label={t("admin.customers.address.form.state", "İlçe")} rules={[{ required: true }]}>
                                <Select
                                    showSearch
                                    disabled={!selectedProvince}
                                    options={selectedProvince ? (TURKEY_DISTRICTS[selectedProvince as keyof typeof TURKEY_DISTRICTS]?.map(d => ({ label: d, value: d })) || []) : []}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="postal_code" label={t("admin.customers.address.form.postal_code", "Posta Kodu")}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="address_line_1" label={t("admin.customers.address.form.line1", "Adres Detayı")} rules={[{ required: true }]}>
                        <Input.TextArea rows={3} placeholder={t("admin.customers.address.form.line1_placeholder", "Mahalle, sokak, no, daire...")} />
                    </Form.Item>

                    <Divider style={{ margin: '12px 0' }} />

                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Text>{t("admin.customers.address.set_billing", "Varsayılan Fatura Adresi")}</Text>
                            <Form.Item name="is_default_billing" valuePropName="checked" noStyle>
                                <Switch size="small" />
                            </Form.Item>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text>{t("admin.customers.address.set_shipping", "Varsayılan Teslimat Adresi")}</Text>
                            <Form.Item name="is_default_shipping" valuePropName="checked" noStyle>
                                <Switch size="small" />
                            </Form.Item>
                        </div>
                    </div>
                </Form>
            </Modal>
        </div >
    );
}
