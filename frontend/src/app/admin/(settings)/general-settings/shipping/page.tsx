"use client";

import React, { useState, useEffect } from "react";
import {
    Table,
    Button,
    Card,
    Switch,
    Space,
    Typography,
    InputNumber,
    App,
    Modal,
    Form,
    Input,
    Tag,
    Tooltip,
    Row,
    Col
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CarOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    QuestionCircleOutlined
} from "@ant-design/icons";
import { usePageHeader } from "@/hooks/usePageHeader";
import { t } from "@/lib/i18n";
import { apiFetch } from "@/lib/api";
import { ShippingMethod } from "@/types/order";

const { Text, Title } = Typography;

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function ShippingSettingsPage() {
    const { message, modal } = App.useApp();
    const [loading, setLoading] = useState(true);
    const [methods, setMethods] = useState<ShippingMethod[]>([]);

    // Modal state
    const [isIdModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    usePageHeader({
        title: t("admin.settings.shipping.title", "Kargo Ayarları"),
        breadcrumb: [
            { label: t("admin.settings.title", "Ayarlar"), href: "/admin/general-settings" },
            { label: t("admin.settings.shipping.title", "Kargo Ayarları") }
        ]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await apiFetch<ShippingMethod[]>("/api/settings/shipping-methods");
            setMethods(data);
        } catch (error: any) {
            message.error(error.message || t("admin.common.error", "Veriler yüklenemedi"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        try {
            await apiFetch(`/api/settings/shipping-methods/${id}`, {
                method: "PUT",
                json: { is_active: !currentStatus }
            });
            message.success(t("admin.settings.shipping.status_updated", "Durum güncellendi"));
            setMethods(methods.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m));
        } catch (error: any) {
            message.error(error.message || t("admin.common.error", "Güncelleme başarısız"));
        }
    };

    const handleEdit = (method: ShippingMethod) => {
        setEditingMethod(method);
        form.setFieldsValue(method);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingMethod(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        modal.confirm({
            title: t("admin.common.confirm_delete", "Silmek istediğinize emin misiniz?"),
            okText: t("admin.common.yes", "Evet"),
            okType: "danger",
            cancelText: t("admin.common.no", "Hayır"),
            onOk: async () => {
                try {
                    await apiFetch(`/api/settings/shipping-methods/${id}`, { method: "DELETE" });
                    message.success(t("admin.settings.shipping.deleted", "Kargo yöntemi silindi"));
                    setMethods(methods.filter(m => m.id !== id));
                } catch (error: any) {
                    message.error(error.message || t("admin.common.error", "Silme başarısız"));
                }
            }
        });
    };

    const handleSave = async (values: any) => {
        setSaving(true);
        try {
            if (editingMethod) {
                await apiFetch(`/api/settings/shipping-methods/${editingMethod.id}`, {
                    method: "PUT",
                    json: values
                });
                message.success(t("admin.settings.shipping.updated", "Kargo yöntemi güncellendi"));
            } else {
                await apiFetch("/api/settings/shipping-methods", {
                    method: "POST",
                    json: values
                });
                message.success(t("admin.settings.shipping.created", "Kargo yöntemi oluşturuldu"));
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            message.error(error.message || t("admin.common.error", "Kayıt başarısız"));
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        {
            title: t("admin.settings.shipping.cols.name", "Adı"),
            dataIndex: "name",
            key: "name",
            render: (text: string, record: ShippingMethod) => (
                <Space>
                    <div style={{ width: 32, height: 32, background: "#f1f5f9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CarOutlined style={{ color: "#64748b" }} />
                    </div>
                    <div>
                        <Text strong>{text}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: t("admin.settings.shipping.cols.rate", "Sabit Ücret"),
            dataIndex: "base_rate",
            key: "base_rate",
            render: (val: number) => <Text strong>{formatCurrency(val)}</Text>
        },
        {
            title: t("admin.settings.shipping.cols.threshold", "Ücretsiz Baraj"),
            dataIndex: "free_threshold",
            key: "free_threshold",
            render: (val: number | null) => val ? <Tag color="green">{formatCurrency(val)}+</Tag> : <Text type="secondary">-</Text>
        },
        {
            title: t("admin.settings.shipping.cols.cod", "K. Ödeme"),
            dataIndex: "cod_enabled",
            key: "cod_enabled",
            render: (enabled: boolean, record: ShippingMethod) => (
                enabled ? (
                    <Tooltip title={`${t("admin.settings.shipping.cod_fee", "Ek Ücret")}: ${formatCurrency(record.cod_fee)}`}>
                        <Tag color="blue">{t("admin.common.enabled", "Aktif")}</Tag>
                    </Tooltip>
                ) : <Text type="secondary">{t("admin.common.disabled", "Kapalı")}</Text>
            )
        },
        {
            title: t("admin.common.status", "Durum"),
            dataIndex: "is_active",
            key: "is_active",
            render: (active: boolean, record: ShippingMethod) => (
                <Switch
                    checked={active}
                    onChange={() => handleToggleActive(record.id, active)}
                    size="small"
                />
            )
        },
        {
            title: t("admin.common.actions", "İşlemler"),
            key: "actions",
            width: 100,
            render: (_: any, record: ShippingMethod) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: "#6366f1" }} />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    />
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card
                title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Space>
                            <CarOutlined />
                            <span>{t("admin.settings.shipping.subtitle", "Kargo Firmaları ve Ücretlendirme")}</span>
                        </Space>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            {t("admin.settings.shipping.add_new", "Yeni Ekle")}
                        </Button>
                    </div>
                }
                className="sh-card"
            >
                <Table
                    columns={columns}
                    dataSource={methods}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                />
            </Card>

            <Modal
                title={editingMethod ? t("admin.settings.shipping.edit", "Düzenle") : t("admin.settings.shipping.add", "Yeni Kargo")}
                open={isIdModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={saving}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    initialValues={{ is_active: true, cod_enabled: false, base_rate: 0, position: 0 }}
                >
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="name" label={t("admin.settings.shipping.form.name", "Firma Adı")} rules={[{ required: true }]}>
                                <Input placeholder="Aras Kargo, Yurtiçi Kargo vb." />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="base_rate" label={t("admin.settings.shipping.form.base_rate", "Sabit Kargo Ücreti")}>
                                <InputNumber style={{ width: "100%" }} min={0} precision={2} prefix="₺" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="free_threshold"
                                label={
                                    <Space>
                                        {t("admin.settings.shipping.form.free_threshold", "Ücretsiz Kargo Barajı")}
                                        <Tooltip title={t("admin.settings.shipping.form.threshold_tip", "Bu tutar üzerindeki siparişlerde kargo ücretsiz olur. Boş bırakılırsa her zaman ücretlidir.")}>
                                            <QuestionCircleOutlined style={{ fontSize: 12, color: "#94a3b8" }} />
                                        </Tooltip>
                                    </Space>
                                }
                            >
                                <InputNumber style={{ width: "100%" }} min={0} precision={2} prefix="₺" placeholder="1000.00" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Card size="small" style={{ background: "#f8fafc", marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <Text strong>{t("admin.settings.shipping.form.cod_settings", "Kapıda Ödeme Ayarları")}</Text>
                            <Form.Item name="cod_enabled" valuePropName="checked" noStyle>
                                <Switch />
                            </Form.Item>
                        </div>
                        <Form.Item noStyle shouldUpdate={(p, c) => p.cod_enabled !== c.cod_enabled}>
                            {({ getFieldValue }) => getFieldValue("cod_enabled") && (
                                <Form.Item name="cod_fee" label={t("admin.settings.shipping.form.cod_fee", "Kapıda Ödeme Hizmet Bedeli")}>
                                    <InputNumber style={{ width: "100%" }} min={0} precision={2} prefix="₺" />
                                </Form.Item>
                            )}
                        </Form.Item>
                    </Card>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="position" label={t("admin.common.position", "Sıralama")}>
                                <InputNumber style={{ width: "100%" }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_active" label={t("admin.common.status", "Durum")} valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
