"use client";

import { App, Button, Col, Input, Row, Space, Table, Typography, Tabs, Badge, ConfigProvider } from "antd";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useI18n } from "@/context/I18nContext";
import { apiFetch } from "@/lib/api";
import { SaveOutlined, SearchOutlined, ReloadOutlined, RollbackOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { usePageHeader } from "@/hooks/usePageHeader";
import { t } from "@/lib/i18n";

const { Text } = Typography;

interface Translation {
    id: number;
    group: string;
    key: string;
    locale: string;
    value: string;
}

export default function TranslationsPage() {
    const { message, modal } = App.useApp();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Veritabanı (Saf)
    const [originalData, setOriginalData] = useState<Translation[]>([]);
    // Canlı State
    const [data, setData] = useState<Translation[]>([]);
    // Görüntülenen (Filtrelenmiş)
    const [displayData, setDisplayData] = useState<Translation[]>([]);

    const [searchText, setSearchText] = useState("");
    const [activeGroup, setActiveGroup] = useState("admin");
    const [activeLocale, setActiveLocale] = useState("tr");

    const { refresh: refreshI18n } = useI18n();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiFetch<Translation[]>(`/api/settings/translations?group=${encodeURIComponent(activeGroup)}&v=${Date.now()}`);
            setOriginalData(JSON.parse(JSON.stringify(res)));
            setData(res);
        } catch (e: any) {
            message.error(t('admin.settings.translations.load_failed', 'Yüklenemedi'));
        } finally {
            setLoading(false);
        }
    }, [activeGroup, message]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // Filtreleme (Stabil)
    useEffect(() => {
        const lowerSearch = searchText.toLowerCase();
        const filtered = data.filter(item => {
            if (item.locale !== activeLocale) return false;
            if (!lowerSearch) return true;

            const orig = originalData.find(o => o.id === item.id);
            return (
                item.key.toLowerCase().includes(lowerSearch) ||
                (orig?.value || "").toLowerCase().includes(lowerSearch)
            );
        });
        setDisplayData(filtered);
    }, [searchText, activeLocale, originalData, data]);

    const isDirty = useMemo(() => {
        return JSON.stringify(data) !== JSON.stringify(originalData);
    }, [data, originalData]);

    const handleValueChange = (id: number, newValue: string) => {
        setData(prev => prev.map(item => item.id === id ? { ...item, value: newValue } : item));
        setDisplayData(prev => prev.map(item => item.id === id ? { ...item, value: newValue } : item));
    };

    const handleDiscard = () => {
        modal.confirm({
            title: t('admin.common.confirm_discard', 'Değişiklikleri Vazgeç?'),
            content: t('admin.common.discard_desc', 'Kaydedilmemiş tüm değişiklikler silinecek.'),
            okText: t('admin.common.yes', 'Evet, Vazgeç'),
            cancelText: t('admin.common.cancel', 'Vazgeçme'),
            onOk: () => {
                const reset = JSON.parse(JSON.stringify(originalData));
                setData(reset);
                message.info(t('admin.common.changes_discarded', 'Geri alındı.'));
            }
        });
    };

    async function handleSave() {
        setSaving(true);
        try {
            const updates = data.map(item => ({ id: item.id, value: item.value }));
            await apiFetch("/api/settings/translations/batch", { method: "POST", json: { translations: updates } });
            setOriginalData(JSON.parse(JSON.stringify(data)));
            await refreshI18n();
            message.success(t('admin.common.save_success', 'Başarıyla kaydedildi.'));
        } catch (e: any) {
            message.error(t('admin.common.save_failed', 'Hata oluştu.'));
        } finally {
            setSaving(false);
        }
    }

    const headerExtra = (
        <Space size={12}>
            {isDirty && (
                <Button icon={<RollbackOutlined />} onClick={handleDiscard} danger type="text" style={{ fontWeight: 500 }}>
                    {t('admin.common.discard', 'Vazgeç')}
                </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={loadData} disabled={loading} style={{ borderRadius: 8 }}>
                {t('admin.common.refresh', 'Yenile')}
            </Button>
            <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSave}
                disabled={!isDirty}
                style={{
                    background: isDirty ? "#111827" : "#f3f4f6",
                    borderColor: isDirty ? "#111827" : "#f3f4f6",
                    borderRadius: 8,
                    fontWeight: 600,
                    padding: "0 24px"
                }}
            >
                {t('admin.common.save', 'Değişiklikleri Kaydet')}
            </Button>
        </Space>
    );

    const headerFooter = (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 24 }}>
            <div style={{ flex: 1 }}>
                <Input
                    placeholder={t('admin.settings.translations.search_placeholder', 'Kelime, cümle veya anahtar (key) ile ara...')}
                    prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    bordered={false}
                    style={{ background: "#f8fafc", borderRadius: 8, height: 40, padding: "0 16px" }}
                    allowClear
                />
            </div>
            <Tabs
                activeKey={activeGroup}
                onChange={(k) => setActiveGroup(k)}
                className="ikas-tabs-mini"
                items={[
                    { key: "admin", label: 'ADMIN' },
                    { key: "storefront", label: 'STOREFRONT' },
                    { key: "storefront_auth", label: 'STOREFRONT AUTH' },
                    { key: "storefront_account", label: 'STOREFRONT ACCOUNT' },
                ]}
                style={{ marginBottom: -16 }}
            />
            <Tabs
                activeKey={activeLocale}
                onChange={setActiveLocale}
                className="ikas-tabs-mini"
                items={[
                    { key: "tr", label: 'TÜRKÇE (TR)' },
                    { key: "en", label: 'ENGLISH (EN)' },
                ]}
                style={{ marginBottom: -16 }}
            />
        </div>
    );

    usePageHeader({
        title: t('admin.settings.dashboard.translations_title', 'Dil ve Çeviri Yönetimi'),
        extra: headerExtra,
        footer: headerFooter
    });

    return (
        <div style={{ background: "#ffffff", minHeight: "100%", padding: "0" }}>
            {isDirty && (
                <div style={{
                    background: '#fffbe6',
                    borderBottom: '1px solid #ffe58f',
                    padding: '8px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 80
                }}>
                    <Space size={12}>
                        <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />
                        <Text strong style={{ fontSize: 13, color: '#856404' }}>{t('admin.settings.translations.unsaved_changes', 'Kaydedilmemiş değişiklikleriniz var.')}</Text>
                    </Space>
                    <Badge color="#faad14" text={<Text style={{ fontSize: 12, fontWeight: 600, color: '#856404' }}>{t('admin.common.pending_save', 'KAYIT BEKLENİYOR')}</Text>} />
                </div>
            )}

            <ConfigProvider
                renderEmpty={() => (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                        <Title level={5} style={{ color: '#64748b' }}>{t('admin.common.no_data', 'Aradığınız kriterlere uygun çeviri bulunamadı.')}</Title>
                        <Text type="secondary">Arama teriminizi kontrol edebilir veya başka bir dilde aramayı deneyebilirsiniz.</Text>
                    </div>
                )}
            >
                <Table<Translation>
                    rowKey="id"
                    dataSource={displayData}
                    loading={loading}
                    pagination={{
                        pageSize: 50,
                        showSizeChanger: true,
                        position: ['bottomRight'],
                        style: { padding: '24px' }
                    }}
                    bordered={false}
                    className="full-screen-table"
                    columns={[
                        {
                            title: t('admin.settings.translations.columns.group', 'Grup'),
                            dataIndex: "group",
                            width: 150,
                            render: (v) => (
                                <Text style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: '0.05em' }}>
                                    {v.replace(/_/g, " ").toUpperCase()}
                                </Text>
                            )
                        },
                        {
                            title: t('admin.settings.translations.columns.key', 'Çeviri Anahtarı (Key)'),
                            dataIndex: "key",
                            width: 350,
                            render: (v) => <Text strong style={{ fontSize: 13, color: "#334155" }}>{v}</Text>
                        },
                        {
                            title: t('admin.settings.translations.columns.value', 'Çeviri Değeri'),
                            dataIndex: "value",
                            render: (v, record) => (
                                <Input.TextArea
                                    autoSize={{ minRows: 1, maxRows: 12 }}
                                    value={v}
                                    onChange={e => handleValueChange(record.id, e.target.value)}
                                    placeholder={t('admin.settings.translations.empty_placeholder', 'Henüz çeviri girilmemiş...')}
                                    className="translation-input"
                                    style={{
                                        borderRadius: 6,
                                        border: "1px solid transparent",
                                        background: "transparent",
                                        padding: "8px 12px",
                                        fontSize: 14,
                                        transition: "all 0.2s"
                                    }}
                                />
                            )
                        }
                    ]}
                />
            </ConfigProvider>

            <style jsx global>{`
                .full-screen-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    color: #475569 !important;
                    font-size: 11px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    padding: 16px 24px !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                }
                .full-screen-table .ant-table-tbody > tr > td {
                    padding: 4px 24px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                }
                .full-screen-table .ant-table-tbody > tr:hover > td {
                    background: #f8fafc !important;
                }
                .translation-input:focus {
                    background: #ffffff !important;
                    border-color: #e2e8f0 !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
                }
                .ikas-tabs-mini .ant-tabs-nav {
                    margin-bottom: 0 !important;
                }
                .ikas-tabs-mini .ant-tabs-tab {
                    padding: 12px 16px !important;
                    font-size: 12px !important;
                    font-weight: 700 !important;
                }
                .ikas-tabs-mini .ant-tabs-ink-bar {
                    height: 3px !important;
                    background: #111827 !important;
                }
                .ikas-tabs-mini .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #111827 !important;
                }
            `}</style>
        </div>
    );
}

const Title = Typography.Title;
