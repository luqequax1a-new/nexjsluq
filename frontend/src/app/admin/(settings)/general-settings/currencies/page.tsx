"use client";

import { App, Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, PlusOutlined, StarOutlined, GlobalOutlined } from "@ant-design/icons";
import { usePageHeader } from "@/hooks/usePageHeader";
import { t } from "@/lib/i18n";

interface Currency {
    id: number;
    code: string;
    name: string;
    symbol: string;
    symbol_position: "left" | "right";
    thousand_separator: string;
    decimal_separator: string;
    no_of_decimals: number;
    exchange_rate: number;
    default: boolean;
    status: boolean;
}

const PREDEFINED_CURRENCIES = [
    { country: "Türkiye", code: "TRY", name: "Türk Lirası", symbol: "₺", position: "right", thousand: ".", decimal: ",", decimals: 0 },
    { country: "ABD", code: "USD", name: "Amerikan Doları", symbol: "$", position: "left", thousand: ",", decimal: ".", decimals: 2 },
    { country: "Avrupa Birliği", code: "EUR", name: "Euro", symbol: "€", position: "right", thousand: ".", decimal: ",", decimals: 2 },
    { country: "Birleşik Krallık", code: "GBP", name: "İngiliz Sterlini", symbol: "£", position: "left", thousand: ",", decimal: ".", decimals: 2 },
    { country: "Azerbaycan", code: "AZN", name: "Azerbaycan Manatı", symbol: "₼", position: "right", thousand: " ", decimal: ".", decimals: 2 },
    { country: "Rusya", code: "RUB", name: "Rus Rublesi", symbol: "₽", position: "right", thousand: ".", decimal: ",", decimals: 2 },
    { country: "Birleşik Arap Emirlikleri", code: "AED", name: "BAE Dirhemi", symbol: "د.إ", position: "right", thousand: ",", decimal: ".", decimals: 2 },
];

export default function CurrenciesPage() {
    const { message } = App.useApp();
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
    const [form] = Form.useForm();

    usePageHeader({
        title: t('admin.settings.dashboard.currencies_title', 'Para Birimleri'),
        extra: (
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                    setEditingCurrency(null);
                    form.resetFields();
                    setModalOpen(true);
                }}
                style={{ background: "#5E5CE6", borderRadius: 8, height: 40 }}
            >
                {t('admin.settings.currencies.add_button', 'Yeni Para Birimi')}
            </Button>
        ),
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await apiFetch<Currency[]>("/api/settings/currencies");
            setCurrencies(res);
        } catch (e: any) {
            message.error(t('admin.settings.currencies.load_failed', 'Veriler yüklenemedi') + ": " + e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const handleSave = async (values: any) => {
        try {
            const payload = {
                ...values,
                no_of_decimals: values.show_decimals ? (values.no_of_decimals ?? 2) : 0
            };

            if (editingCurrency) {
                await apiFetch(`/api/settings/currencies/${editingCurrency.id}`, {
                    method: "PUT",
                    json: payload,
                });
                message.success(t('admin.settings.currencies.save_success', 'Para birimi güncellendi'));
            } else {
                await apiFetch("/api/settings/currencies", {
                    method: "POST",
                    json: payload,
                });
                message.success(t('admin.settings.currencies.create_success', 'Para birimi oluşturuldu'));
            }
            setModalOpen(false);
            void loadData();
        } catch (e: any) {
            message.error(e.message || t('admin.common.error_occurred', 'İşlem başarısız'));
        }
    };

    const handlePredefinedSelect = (code: string) => {
        const found = PREDEFINED_CURRENCIES.find(c => c.code === code);
        if (found) {
            form.setFieldsValue({
                code: found.code,
                name: found.name,
                symbol: found.symbol,
                symbol_position: found.position,
                thousand_separator: found.thousand,
                decimal_separator: found.decimal,
                no_of_decimals: found.decimals,
                show_decimals: found.decimals > 0
            });
        }
    };

    const handleSetDefault = async (currency: Currency) => {
        try {
            await apiFetch(`/api/settings/currencies/${currency.id}/set-default`, {
                method: "POST",
            });
            message.success(t('admin.settings.currencies.default_success', 'Varsayılan para birimi güncellendi'));
            void loadData();
        } catch (e: any) {
            message.error(e.message || t('admin.common.error_occurred', 'İşlem başarısız'));
        }
    };

    const handleDelete = async (currency: Currency) => {
        try {
            await apiFetch(`/api/settings/currencies/${currency.id}`, { method: "DELETE" });
            message.success(t('admin.settings.currencies.delete_success', 'Para birimi silindi'));
            void loadData();
        } catch (e: any) {
            message.error(e.message || t('admin.common.delete_failed', 'Silme başarısız'));
        }
    };

    return (
        <div style={{ padding: "0" }}>
            <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #f0f0f0" }}>
                <Table<Currency>
                    rowKey="id"
                    loading={loading}
                    dataSource={currencies}
                    pagination={false}
                    className="custom-table"
                    columns={[
                        {
                            title: t('admin.settings.currencies.columns.currency', 'Para Birimi'),
                            key: "currency",
                            render: (_, record) => (
                                <Space direction="vertical" size={0}>
                                    <Space>
                                        <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{record.name}</span>
                                        <Tag color="blue" style={{ borderRadius: 4, fontWeight: 600 }}>{record.code}</Tag>
                                        {record.default && <Tag color="gold" icon={<StarOutlined />} style={{ borderRadius: 4 }}>{t('admin.settings.currencies.default_label', 'Varsayılan')}</Tag>}
                                    </Space>
                                    <span style={{ fontSize: 12, color: "#64748b" }}>{t('admin.settings.currencies.symbol_label', 'Sembol')}: {record.symbol} ({record.symbol_position === 'left' ? t('admin.common.left', 'Sol') : t('admin.common.right', 'Sağ')})</span>
                                </Space>
                            ),
                        },
                        {
                            title: t('admin.settings.currencies.columns.format', 'Format'),
                            key: "format",
                            render: (_, record) => {
                                const amount = 1250.50;
                                let formatted = amount.toLocaleString('en-US', {
                                    minimumFractionDigits: record.no_of_decimals,
                                    maximumFractionDigits: record.no_of_decimals,
                                });
                                // Apply custom separators if needed (simulated for display)
                                formatted = formatted.replace(",", "TEMP").replace(".", record.decimal_separator).replace("TEMP", record.thousand_separator);

                                return (
                                    <div style={{ background: "#f8fafc", padding: "4px 12px", borderRadius: 6, display: "inline-block", fontWeight: 600, color: "#334155" }}>
                                        {record.symbol_position === "left" ? `${record.symbol} ${formatted}` : `${formatted} ${record.symbol}`}
                                    </div>
                                );
                            },
                        },
                        {
                            title: t('admin.settings.currencies.columns.exchange_rate', 'Döviz Kuru'),
                            dataIndex: "exchange_rate",
                            key: "exchange_rate",
                            render: (rate) => (
                                <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}>
                                    {Number(rate).toFixed(4)}
                                </span>
                            ),
                        },
                        {
                            title: t('admin.common.status', 'Durum'),
                            dataIndex: "status",
                            key: "status",
                            render: (status) => (
                                <Tag color={status ? "success" : "default"} style={{ borderRadius: 20, padding: "0 12px" }}>
                                    {status ? t('admin.common.active', 'Aktif') : t('admin.common.passive', 'Pasif')}
                                </Tag>
                            ),
                        },
                        {
                            title: t('admin.common.actions', 'İşlemler'),
                            key: "actions",
                            align: "right",
                            width: 280,
                            render: (_, currency) => (
                                <Space>
                                    {!currency.default && (
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<StarOutlined />}
                                            onClick={() => handleSetDefault(currency)}
                                            style={{ color: "#f59e0b" }}
                                        >
                                            {t('admin.settings.currencies.set_default', 'Varsayılan')}
                                        </Button>
                                    )}
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => {
                                            setEditingCurrency(currency);
                                            form.setFieldsValue({
                                                ...currency,
                                                show_decimals: (currency.no_of_decimals ?? 0) > 0
                                            });
                                            setModalOpen(true);
                                        }}
                                        style={{ color: "#5E5CE6" }}
                                    >
                                        {t('admin.common.edit', 'Düzenle')}
                                    </Button>
                                    {!currency.default && (
                                        <Popconfirm
                                            title={t('admin.settings.currencies.delete_confirm', 'Para birimi silinsin mi?')}
                                            onConfirm={() => handleDelete(currency)}
                                            okText={t('admin.common.yes', 'Evet')}
                                            cancelText={t('admin.common.no', 'Hayır')}
                                        >
                                            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
                                                {t('admin.common.delete', 'Sil')}
                                            </Button>
                                        </Popconfirm>
                                    )}
                                </Space>
                            ),
                        },
                    ]}
                />
            </Card>

            <Modal
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <GlobalOutlined style={{ color: "#5E5CE6" }} />
                        <span>{editingCurrency ? t('admin.settings.currencies.edit_title', 'Para Birimini Düzenle') : t('admin.settings.currencies.add_title', 'Para Birimi Ekle')}</span>
                    </div>
                }
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={() => form.submit()}
                width={500}
                okText={t('admin.common.save', 'Kaydet')}
                cancelText={t('admin.common.cancel', 'İptal')}
                styles={{ body: { paddingTop: 20 } }}
            >
                <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ status: true, no_of_decimals: 2, show_decimals: true, symbol_position: "left" }}>
                    {!editingCurrency && (
                        <Form.Item label={t('admin.settings.currencies.predefined_label', 'Hazır Para Birimi Seçin')} style={{ marginBottom: 24 }}>
                            <Select
                                placeholder={t('admin.settings.currencies.predefined_placeholder', 'Ülke veya Para Birimi Seçin')}
                                showSearch
                                onChange={handlePredefinedSelect}
                                style={{ height: 45 }}
                                options={PREDEFINED_CURRENCIES.map(c => ({
                                    value: c.code,
                                    label: `${c.country} - ${c.name} (${c.code})`
                                }))}
                            />
                        </Form.Item>
                    )}

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="code" label={t('admin.settings.currencies.code_label', 'Kod')} rules={[{ required: true }]}>
                                <Input placeholder="TRY" maxLength={3} />
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item name="name" label={t('admin.settings.currencies.name_label', 'Ad')} rules={[{ required: true }]}>
                                <Input placeholder="Türk Lirası" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="symbol" label={t('admin.settings.currencies.symbol_label', 'Sembol')} rules={[{ required: true }]}>
                                <Input placeholder="₺" />
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item name="symbol_position" label={t('admin.settings.currencies.alignment_label', 'Hizalama (Sağ/Sol)')} rules={[{ required: true }]}>
                                <Select
                                    options={[
                                        { value: "left", label: t('admin.settings.currencies.alignment_left', 'Fiyatın Solunda (₺ 150)') },
                                        { value: "right", label: t('admin.settings.currencies.alignment_right', 'Fiyatın Sağında (150 ₺)') },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, marginBottom: 24 }}>
                        <Row gutter={16} align="middle">
                            <Col span={12}>
                                <Form.Item name="show_decimals" label={t('admin.settings.currencies.show_decimals_label', 'Kuruş/Ondalık Göster')} valuePropName="checked" style={{ marginBottom: 0 }}>
                                    <Switch size="small" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    noStyle
                                    shouldUpdate={(prev, curr) => prev.show_decimals !== curr.show_decimals}
                                >
                                    {({ getFieldValue }) => getFieldValue('show_decimals') && (
                                        <Form.Item name="no_of_decimals" label={t('admin.settings.currencies.decimals_count_label', 'Hane Sayısı')} style={{ marginBottom: 0 }}>
                                            <InputNumber min={1} max={4} style={{ width: "100%" }} />
                                        </Form.Item>
                                    )}
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.show_decimals !== curr.show_decimals}>
                            {({ getFieldValue }) => getFieldValue('show_decimals') && (
                                <Row gutter={12} style={{ marginTop: 12 }}>
                                    <Col span={12}>
                                        <Form.Item name="thousand_separator" label={t('admin.settings.currencies.thousand_separator_label', 'Binlik Ayr.')} style={{ marginBottom: 0 }}>
                                            <Input maxLength={1} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="decimal_separator" label={t('admin.settings.currencies.decimal_separator_label', 'Ondalık Ayr.')} style={{ marginBottom: 0 }}>
                                            <Input maxLength={1} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}
                        </Form.Item>
                    </div>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="exchange_rate"
                                label={t('admin.settings.currencies.exchange_rate_label', 'Döviz Kuru')}
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={0} step={0.0001} precision={4} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="status" label={t('admin.settings.currencies.is_active_label', 'Aktif mi?')} valuePropName="checked">
                                <Switch checkedChildren={t('admin.common.on', 'Açık')} unCheckedChildren={t('admin.common.off', 'Kapalı')} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <style jsx global>{`
                .custom-table .ant-table-thead > tr > th {
                    background: #f8fafc;
                    color: #64748b;
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 11px;
                    letter-spacing: 0.5px;
                }
                .custom-table .ant-table-row:hover {
                    background-color: #fcfcff !important;
                }
            `}</style>
        </div>
    );
}
