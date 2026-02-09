"use client";

import { usePageHeader } from "@/hooks/usePageHeader";
import { apiFetch } from "@/lib/api";
import { App, Card, Form, Input, Button, Upload, Row, Col, Typography, Select, Switch } from "antd";
import { PageLoader } from "@/components/admin/PageLoader";
import {
    UploadOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { useEffect, useState, useCallback } from "react";
import { t } from "@/lib/i18n";
import { TURKEY_PROVINCES, TURKEY_DISTRICTS } from "@/lib/turkey-locations";
import { trSelectFilterOption } from "@/lib/trSearch";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function GeneralSettingsPage() {
    const { message: antMessage } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
    const storeCountry = Form.useWatch('store_country', form);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const settingsData = await apiFetch<any>("/api/settings/general");

            let currenciesData: any[] = [];
            try {
                currenciesData = await apiFetch<any[]>("/api/settings/currencies");
            } catch {
                currenciesData = [];
            }

            const defaultLocale = "tr";

            form.setFieldsValue({
                store_name: settingsData.store_name || "",
                store_meta_title: settingsData.store_meta_title || "",
                store_meta_description: settingsData.store_meta_description || "",
                store_email: settingsData.store_email || "",
                store_phone: settingsData.store_phone || "",
                store_address: settingsData.store_address || "",
                store_country: settingsData.store_country || "TR",
                store_city: settingsData.store_city || "",
                store_district: settingsData.store_district || "",
                store_postcode: settingsData.store_postcode || "",
                default_locale: defaultLocale,
                default_currency: settingsData.default_currency || "TRY",
                timezone: settingsData.timezone || "Europe/Istanbul",
                maintenance_mode: settingsData.maintenance_mode === "1" || settingsData.maintenance_mode === true,
                logo: settingsData.logo || "",
                favicon: settingsData.favicon || ""
            });

            setSelectedProvince(settingsData.store_city || null);

            setLogoPreview(settingsData.logo || null);
            setFaviconPreview(settingsData.favicon || null);
            setCurrencies(currenciesData);
        } catch (e: any) {
            antMessage.error(t('admin.settings.general.load_failed', 'Ayarlar yüklenemedi'));
        } finally {
            setLoading(false);
        }
    }, [form, antMessage]);

    useEffect(() => {
        void fetchSettings();
    }, [fetchSettings]);

    const handleSave = async (values: any) => {
        try {
            setSaving(true);

            const payload = {
                ...values,
                maintenance_mode: values?.maintenance_mode ? "1" : "0",
            };
            await apiFetch("/api/settings/general", {
                method: "POST",
                json: payload
            });

            await fetchSettings();

            antMessage.success(t('admin.settings.general.save_success', 'Ayarlar başarıyla veritabanına kaydedildi.'));
            window.dispatchEvent(new Event('settings-updated'));
        } catch (e: any) {
            antMessage.error(e.message || t('admin.common.save_failed', 'Kaydedilemedi'));
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (file: any, type: 'logo' | 'favicon') => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            // apiFetch handles auth token automatically now!
            const data = await apiFetch<any>("/api/media/upload", {
                method: 'POST',
                body: formData
            });

            if (data.url) {
                form.setFieldsValue({ [type]: data.url });
                if (type === 'logo') setLogoPreview(data.url);
                else setFaviconPreview(data.url);

                antMessage.success(t('admin.common.upload_done', 'Dosya yüklendi, kaydetmeyi unutmayın.'));
            }
        } catch (e: any) {
            console.error("Upload error:", e);
            antMessage.error(t('admin.settings.general.upload_failed', 'Dosya yüklenemedi'));
        }
        return false;
    };

    usePageHeader({
        title: t('admin.settings.dashboard.general_settings_title', 'Genel Ayarlar'),
        variant: "light",
        extra: (
            <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => form.submit()}
                loading={saving}
                style={{ background: "#111827", borderColor: "#111827", borderRadius: 6, fontWeight: 500 }}
            >
                {t('admin.common.save', 'Kaydet')}
            </Button>
        )
    });

    if (loading) {
        return <PageLoader />;
    }

    return (
        <div style={{ padding: "0 24px 80px 24px", maxWidth: 1000, margin: '0 auto' }}>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                autoComplete="off"
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} // Prevent auto-save on Enter
            >
                <Form.Item name="logo" hidden><Input /></Form.Item>
                <Form.Item name="favicon" hidden><Input /></Form.Item>

                <div style={{ marginBottom: 32 }}>
                    <Title level={5} style={{ marginBottom: 4, fontWeight: 600 }}>{t('admin.settings.general.sections.identity_title', 'Mağaza Bilgileri')}</Title>
                    <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>{t('admin.settings.general.sections.identity_desc', 'Mağaza adı ve temel iletişim bilgileri.')}</Paragraph>
                    <Card styles={{ body: { padding: 24 } }} style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Form.Item name="store_name" label={t('admin.settings.general.store_name', 'Mağaza Adı')} required>
                                    <Input placeholder="Fabric Market" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="store_meta_title" label={t('admin.settings.general.meta_title', 'Meta Title')}>
                                    <Input placeholder="FabricMarket | Kalitenin Adresi" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="store_meta_description" label={t('admin.settings.general.meta_description', 'Meta Description')}>
                                    <Input placeholder="Türkiye'nin en büyük kumaş marketi. Online kumaş satışı." />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="store_email" label={t('admin.settings.general.store_email', 'E-posta Adresi')} required>
                                    <Input placeholder="info@company.com" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="store_phone" label={t('admin.settings.general.store_phone', 'Telefon')}>
                                    <Input placeholder="+90" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="store_address" label={t('admin.settings.general.store_address', 'Adres')}>
                                    <Input.TextArea rows={2} />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <div style={{ height: 4 }} />
                            </Col>

                            <Col span={6}>
                                <Form.Item name="store_country" label={t('admin.settings.general.country', 'Ülke')}>
                                    <Select
                                        showSearch
                                        optionFilterProp="label"
                                        options={[
                                            { value: 'TR', label: '🇹🇷 Türkiye (TR)' },
                                            { value: 'EN', label: '🇬🇧 United Kingdom (EN)' },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="store_city" label={t('admin.settings.general.city', 'İl')}>
                                    <Select
                                        showSearch
                                        disabled={(storeCountry || 'TR') !== 'TR'}
                                        filterOption={trSelectFilterOption}
                                        onChange={(v) => {
                                            setSelectedProvince(v);
                                            form.setFieldsValue({ store_district: undefined });
                                        }}
                                        options={TURKEY_PROVINCES.map((p) => ({ value: p, label: p }))}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="store_district" label={t('admin.settings.general.district', 'İlçe')}>
                                    <Select
                                        showSearch
                                        disabled={!selectedProvince}
                                        filterOption={trSelectFilterOption}
                                        options={(selectedProvince ? (TURKEY_DISTRICTS as any)[selectedProvince] || [] : []).map((d: string) => ({ value: d, label: d }))}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="store_postcode" label={t('admin.settings.general.postcode', 'Posta Kodu')}>
                                    <Input placeholder="34000" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </div>

                <div style={{ marginBottom: 32 }}>
                    <Title level={5} style={{ marginBottom: 4, fontWeight: 600 }}>{t('admin.settings.general.sections.branding_title', 'Görsel Kimlik')}</Title>
                    <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>{t('admin.settings.general.sections.branding_desc', 'Logolar ve tarayıcı simgeleri.')}</Paragraph>
                    <Card styles={{ body: { padding: 24 } }} style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
                        <Row gutter={32}>
                            <Col span={12}>
                                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>{t('admin.settings.general.logo', 'Logo')}</Text>
                                <div style={{
                                    height: 80, background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 6,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden'
                                }}>
                                    {logoPreview ? <img src={logoPreview} style={{ maxHeight: '70%', maxWidth: '80%', objectFit: 'contain' }} /> : <Text type="secondary" style={{ fontSize: 12 }}>{t('admin.settings.general.no_logo', 'Logo Yok')}</Text>}
                                </div>
                                <Upload beforeUpload={(f) => handleFileUpload(f, 'logo')} showUploadList={false}>
                                    <Button size="small" icon={<UploadOutlined />}>{t('admin.settings.general.upload_logo', 'Değiştir')}</Button>
                                </Upload>
                            </Col>
                            <Col span={12}>
                                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>{t('admin.settings.general.favicon', 'Favicon')}</Text>
                                <div style={{
                                    height: 80, background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 6,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12
                                }}>
                                    {faviconPreview ? <img src={faviconPreview} style={{ width: 32, height: 32 }} /> : <Text type="secondary" style={{ fontSize: 12 }}>{t('admin.settings.general.no_favicon', 'Yok')}</Text>}
                                </div>
                                <Upload beforeUpload={(f) => handleFileUpload(f, 'favicon')} showUploadList={false}>
                                    <Button size="small" icon={<UploadOutlined />}>{t('admin.settings.general.upload_favicon', 'Değiştir')}</Button>
                                </Upload>
                            </Col>
                        </Row>
                    </Card>
                </div>

                <div style={{ marginBottom: 32 }}>
                    <Title level={5} style={{ marginBottom: 4, fontWeight: 600 }}>{t('admin.settings.general.sections.regional_title', 'Bölgesel Ayarlar')}</Title>
                    <Card styles={{ body: { padding: 24 } }} style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="default_locale" label={t('admin.settings.general.default_language', 'Varsayılan Dil')}>
                                    <Select disabled>
                                        <Option value="tr">Türkçe (TR)</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="default_currency" label={t('admin.settings.general.default_currency', 'Varsayılan Para Birimi')}>
                                    <Select>
                                        {currencies.map(c => (
                                            <Option key={c.id} value={c.code}>{c.name} ({c.code})</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="timezone" label={t('admin.settings.general.timezone', 'Zaman Dilimi')} style={{ marginBottom: 0 }}>
                                    <Select showSearch>
                                        <Option value="Europe/Istanbul">Europe/Istanbul (GMT+03:00)</Option>
                                        <Option value="UTC">UTC (GMT+00:00)</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </div>

                <div style={{ marginBottom: 32 }}>
                    <Title level={5} style={{ marginBottom: 4, fontWeight: 600 }}>{t('admin.settings.general.sections.maintenance_title', 'Bakım Modu')}</Title>
                    <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>{t('admin.settings.general.sections.maintenance_desc', 'Mağazanızı bakıma alarak ziyaretçilere kapatın.')}</Paragraph>
                    <Card styles={{ body: { padding: 24 } }} style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
                        <Row gutter={16} align="middle">
                            <Col span={18}>
                                <div>
                                    <Text strong style={{ display: 'block' }}>{t('admin.settings.general.maintenance_mode', 'Bakım Modu Aktif')}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{t('admin.settings.general.maintenance_help', 'Aktive edildiğinde müşteriler "Bakım Çalışması Var" uyarısı görür.')}</Text>
                                </div>
                            </Col>
                            <Col span={6} style={{ textAlign: 'right' }}>
                                <Form.Item name="maintenance_mode" valuePropName="checked" style={{ marginBottom: 0 }}>
                                    <Switch />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </div>
            </Form>
        </div>
    );
}
