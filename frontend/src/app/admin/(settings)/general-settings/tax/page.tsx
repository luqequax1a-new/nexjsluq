"use client";

import { App, Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { usePageHeader } from "@/hooks/usePageHeader";
import { t } from "@/lib/i18n";

interface TaxRate {
    id: number;
    tax_class_id: number;
    country: string;
    state: string;
    city: string;
    zip: string;
    rate: number;
    position: number;
    name: string;
    translations: Array<{ locale: string; name: string }>;
}

interface TaxClass {
    id: number;
    based_on: string;
    label: string;
    translations: Array<{ locale: string; label: string }>;
    tax_rates: TaxRate[];
}

export default function TaxClassesPage() {
    const { message, modal } = App.useApp();
    const [taxClasses, setTaxClasses] = useState<TaxClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [classModalOpen, setClassModalOpen] = useState(false);
    const [rateModalOpen, setRateModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<TaxClass | null>(null);
    const [editingRate, setEditingRate] = useState<TaxRate | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [classForm] = Form.useForm();
    const [rateForm] = Form.useForm();

    usePageHeader({
        title: t('admin.settings.dashboard.taxes_title', 'Vergi Sınıfları'),
        extra: (
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                    setEditingClass(null);
                    classForm.resetFields();
                    setClassModalOpen(true);
                }}
                style={{ background: "#5E5CE6", borderRadius: 8 }}
            >
                {t('admin.settings.taxes.add_button', 'Yeni Vergi Sınıfı')}
            </Button>
        ),
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await apiFetch<TaxClass[]>("/api/settings/tax-classes");
            setTaxClasses(res);
        } catch (e: any) {
            message.error(t('admin.settings.taxes.load_failed', 'Veriler yüklenemedi') + ": " + e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const handleSaveClass = async (values: any) => {
        try {
            if (editingClass) {
                await apiFetch(`/api/settings/tax-classes/${editingClass.id}`, {
                    method: "PUT",
                    json: values,
                });
                message.success(t('admin.settings.taxes.class_save_success', 'Vergi sınıfı güncellendi'));
            } else {
                await apiFetch("/api/settings/tax-classes", {
                    method: "POST",
                    json: values,
                });
                message.success(t('admin.settings.taxes.class_create_success', 'Vergi sınıfı oluşturuldu'));
            }
            setClassModalOpen(false);
            void loadData();
        } catch (e: any) {
            message.error(e.message || t('admin.common.error_occurred', 'İşlem başarısız'));
        }
    };

    const handleDeleteClass = async (taxClass: TaxClass) => {
        try {
            await apiFetch(`/api/settings/tax-classes/${taxClass.id}`, { method: "DELETE" });
            message.success(t('admin.settings.taxes.class_delete_success', 'Vergi sınıfı silindi'));
            void loadData();
        } catch (e: any) {
            message.error(e.message || t('admin.common.delete_failed', 'Silme başarısız'));
        }
    };

    const handleEditClass = (taxClass: TaxClass) => {
        setEditingClass(taxClass);
        const enLabel = taxClass.translations.find(t => t.locale === 'en')?.label || '';
        const trLabel = taxClass.translations.find(t => t.locale === 'tr')?.label || '';
        classForm.setFieldsValue({
            based_on: taxClass.based_on,
            label: enLabel,
            label_tr: trLabel,
        });
        setClassModalOpen(true);
    };

    const handleSaveRate = async (values: any) => {
        try {
            const payload = {
                ...values,
                tax_class_id: selectedClassId,
            };

            if (editingRate) {
                await apiFetch(`/api/settings/tax-rates/${editingRate.id}`, {
                    method: "PUT",
                    json: payload,
                });
                message.success(t('admin.settings.taxes.rate_save_success', 'Vergi oranı güncellendi'));
            } else {
                await apiFetch("/api/settings/tax-rates", {
                    method: "POST",
                    json: payload,
                });
                message.success(t('admin.settings.taxes.rate_create_success', 'Vergi oranı oluşturuldu'));
            }
            setRateModalOpen(false);
            void loadData();
        } catch (e: any) {
            message.error(e.message || t('admin.common.error_occurred', 'İşlem başarısız'));
        }
    };

    const handleDeleteRate = async (rate: TaxRate) => {
        try {
            await apiFetch(`/api/settings/tax-rates/${rate.id}`, { method: "DELETE" });
            message.success(t('admin.settings.taxes.rate_delete_success', 'Vergi oranı silindi'));
            void loadData();
        } catch (e: any) {
            message.error(e.message || t('admin.common.delete_failed', 'Silme başarısız'));
        }
    };

    const handleAddRate = (classId: number) => {
        setSelectedClassId(classId);
        setEditingRate(null);
        rateForm.resetFields();
        setRateModalOpen(true);
    };

    const handleEditRate = (rate: TaxRate) => {
        setSelectedClassId(rate.tax_class_id);
        setEditingRate(rate);
        const enName = rate.translations.find(t => t.locale === 'en')?.name || '';
        const trName = rate.translations.find(t => t.locale === 'tr')?.name || '';
        rateForm.setFieldsValue({
            country: rate.country,
            state: rate.state,
            city: rate.city,
            zip: rate.zip,
            rate: rate.rate,
            position: rate.position,
            name: enName,
            name_tr: trName,
        });
        setRateModalOpen(true);
    };

    return (
        <>
            <Space direction="vertical" style={{ width: "100%" }} size="large">
                {taxClasses.map((taxClass) => (
                    <Card
                        key={taxClass.id}
                        title={
                            <Space>
                                <span style={{ fontWeight: 600, fontSize: 16 }}>{taxClass.label}</span>
                                <Tag color="blue">{taxClass.based_on.replace(/_/g, ' ')}</Tag>
                            </Space>
                        }
                        extra={
                            <Space>
                                <Button
                                    type="text"
                                    icon={<PlusOutlined />}
                                    onClick={() => handleAddRate(taxClass.id)}
                                    style={{ color: "#5E5CE6" }}
                                >
                                    {t('admin.settings.taxes.add_rate', 'Oran Ekle')}
                                </Button>
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditClass(taxClass)}
                                    style={{ color: "#5E5CE6" }}
                                >
                                    {t('admin.common.edit', 'Düzenle')}
                                </Button>
                                <Popconfirm
                                    title={t('admin.settings.taxes.class_delete_confirm', 'Bu vergi sınıfını silmek istediğinize emin misiniz?')}
                                    onConfirm={() => handleDeleteClass(taxClass)}
                                    okText={t('admin.common.yes', 'Evet')}
                                    cancelText={t('admin.common.no', 'Hayır')}
                                >
                                    <Button type="text" danger icon={<DeleteOutlined />}>
                                        {t('admin.common.delete', 'Sil')}
                                    </Button>
                                </Popconfirm>
                            </Space>
                        }
                    >
                        <Table<TaxRate>
                            rowKey="id"
                            dataSource={taxClass.tax_rates || []}
                            pagination={false}
                            size="small"
                            columns={[
                                {
                                    title: t('admin.settings.taxes.columns.rate_name', 'Oran Adı'),
                                    dataIndex: "name",
                                    key: "name",
                                    render: (_, rate) => rate.translations.find(t => t.locale === 'tr')?.name || rate.translations[0]?.name,
                                },
                                {
                                    title: t('admin.common.country', 'Ülke'),
                                    dataIndex: "country",
                                    key: "country",
                                },
                                {
                                    title: t('admin.common.state', 'Eyalet'),
                                    dataIndex: "state",
                                    key: "state",
                                },
                                {
                                    title: t('admin.common.city', 'Şehir'),
                                    dataIndex: "city",
                                    key: "city",
                                },
                                {
                                    title: t('admin.common.zip', 'Posta Kodu'),
                                    dataIndex: "zip",
                                    key: "zip",
                                },
                                {
                                    title: t('admin.settings.taxes.columns.rate_percent', 'Oran (%)'),
                                    dataIndex: "rate",
                                    key: "rate",
                                    render: (rate) => `%${rate}`,
                                },
                                {
                                    title: t('admin.common.actions', 'İşlemler'),
                                    key: "actions",
                                    align: "right",
                                    render: (_, rate) => (
                                        <Space>
                                            <Button
                                                type="text"
                                                icon={<EditOutlined />}
                                                onClick={() => handleEditRate(rate)}
                                                size="small"
                                            />
                                            <Popconfirm
                                                title={t('admin.settings.taxes.rate_delete_confirm', 'Bu oranı silmek istediğinize emin misiniz?')}
                                                onConfirm={() => handleDeleteRate(rate)}
                                                okText={t('admin.common.yes', 'Evet')}
                                                cancelText={t('admin.common.no', 'Hayır')}
                                            >
                                                <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                                            </Popconfirm>
                                        </Space>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                ))}
            </Space>

            <Modal
                title={editingClass ? t('admin.settings.taxes.class_edit_title', 'Vergi Sınıfını Düzenle') : t('admin.settings.taxes.class_add_title', 'Yeni Vergi Sınıfı')}
                open={classModalOpen}
                onCancel={() => setClassModalOpen(false)}
                onOk={() => classForm.submit()}
                okText={t('admin.common.save', 'Kaydet')}
                cancelText={t('admin.common.cancel', 'İptal')}
            >
                <Form form={classForm} layout="vertical" onFinish={handleSaveClass}>
                    <Form.Item
                        name="label"
                        label={t('admin.settings.taxes.label_en', 'Etiket (İngilizce)')}
                        rules={[{ required: true, message: t('admin.settings.taxes.label_required', 'Etiket gereklidir') }]}
                    >
                        <Input placeholder="Standard Tax" />
                    </Form.Item>

                    <Form.Item name="label_tr" label={t('admin.settings.taxes.label_tr', 'Etiket (Türkçe)')}>
                        <Input placeholder="Standart Vergi" />
                    </Form.Item>

                    <Form.Item
                        name="based_on"
                        label={t('admin.settings.taxes.based_on', 'Hesaplama Temeli')}
                        rules={[{ required: true, message: t('admin.settings.taxes.based_on_required', 'Hesaplama temeli gereklidir') }]}
                    >
                        <Select
                            options={[
                                { value: "shipping_address", label: t('admin.settings.taxes.shipping_address', 'Teslimat Adresi') },
                                { value: "billing_address", label: t('admin.settings.taxes.billing_address', 'Fatura Adresi') },
                                { value: "store_address", label: t('admin.settings.taxes.store_address', 'Mağaza Adresi') },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={editingRate ? t('admin.settings.taxes.rate_edit_title', 'Vergi Oranını Düzenle') : t('admin.settings.taxes.rate_add_title', 'Yeni Vergi Oranı')}
                open={rateModalOpen}
                onCancel={() => setRateModalOpen(false)}
                onOk={() => rateForm.submit()}
                okText={t('admin.common.save', 'Kaydet')}
                cancelText={t('admin.common.cancel', 'İptal')}
                width={600}
            >
                <Form form={rateForm} layout="vertical" onFinish={handleSaveRate}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label={t('admin.settings.taxes.rate_name_en', 'Oran Adı (İngilizce)')}
                                rules={[{ required: true, message: t('admin.settings.taxes.rate_name_required', 'Oran adı gereklidir') }]}
                            >
                                <Input placeholder="VAT" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="name_tr" label={t('admin.settings.taxes.rate_name_tr', 'Oran Adı (Türkçe)')}>
                                <Input placeholder="KDV" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="rate"
                                label={t('admin.settings.taxes.rate_percent_label', 'Oran (%)')}
                                rules={[{ required: true, message: t('admin.settings.taxes.rate_required', 'Oran gereklidir') }]}
                            >
                                <InputNumber min={0} max={100} step={0.01} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="position" label={t('admin.common.position', 'Sıra')}>
                                <InputNumber min={0} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="country" label={t('admin.common.country_code', 'Ülke Kodu')}>
                                <Input placeholder="TR (* tümü için)" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="state" label={t('admin.common.state', 'Eyalet')}>
                                <Input placeholder="* (tümü için)" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="city" label={t('admin.common.city', 'Şehir')}>
                                <Input placeholder="* (tümü için)" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="zip" label={t('admin.common.zip', 'Posta Kodu')}>
                                <Input placeholder="* (tümü için)" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </>
    );
}
