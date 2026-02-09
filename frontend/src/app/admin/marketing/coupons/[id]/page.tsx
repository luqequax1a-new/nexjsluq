"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { App, Spin, Tabs, Table, Card, Row, Col, Statistic, Typography, Tag, Space } from "antd";
import { usePageHeader } from "@/hooks/usePageHeader";
import { t } from "@/lib/i18n";
import { apiFetch } from "@/lib/api";
import { CouponForm } from "@/components/admin/marketing/CouponForm";
import {
    HistoryOutlined,
    EditOutlined,
    BarChartOutlined,
    ShoppingCartOutlined,
    PercentageOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

export default function EditCouponPage() {
    const params = useParams();
    const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab") || "edit";
    const { message } = App.useApp();

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [coupon, setCoupon] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    usePageHeader({
        title: coupon ? `${t("admin.marketing.coupons.edit", "Düzenle")}: ${coupon.code || coupon.name}` : t("admin.common.loading", "Yükleniyor..."),
        variant: "dark",
        onBack: () => router.push("/admin/marketing/coupons"),
    });

    useEffect(() => {
        if (!id) return;
        loadCoupon();
        loadStats();
        loadLogs();
    }, [id]);

    const loadCoupon = async () => {
        try {
            const res = await apiFetch<any>(`/api/marketing/coupons/${id}`);
            setCoupon(res);
        } catch (e) {
            message.error(t("admin.common.load_error", "Kupon yüklenemedi"));
            router.push("/admin/marketing/coupons");
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const res = await apiFetch<any>(`/api/marketing/coupons/${id}/statistics`);
            setStats(res);
        } catch (e) {
            console.error(e);
        }
    };

    const loadLogs = async () => {
        setLogsLoading(true);
        try {
            const res = await apiFetch<any>(`/api/marketing/coupons/${id}/usage-logs`);
            setLogs(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLogsLoading(false);
        }
    };

    const handleSave = async (values: any) => {
        setSaving(true);
        try {
            await apiFetch(`/api/marketing/coupons/${id}`, {
                method: "PUT",
                json: values,
            });
            message.success(t("admin.marketing.coupons.update_success", "Kupon güncellendi"));
            router.push("/admin/marketing/coupons");
        } catch (error: any) {
            message.error(error.message || t("admin.common.error", "Bir hata oluştu"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;

    const logColumns = [
        {
            title: t("admin.orders.order_number", "Sipariş No"),
            dataIndex: ["order", "order_number"],
            key: "order_no",
            render: (text: string, record: any) => (
                <Text copyable>{text || `#${record.order_id}`}</Text>
            )
        },
        {
            title: t("admin.customers.name", "Müşteri"),
            key: "customer",
            render: (_: any, record: any) => (
                record.customer ? `${record.customer.first_name} ${record.customer.last_name}` : t("admin.common.guest", "Misafir")
            )
        },
        {
            title: t("admin.marketing.coupons.discount_amount", "İndirim Tutarı"),
            dataIndex: "discount_amount",
            key: "discount",
            render: (val: number) => <Text strong type="danger">₺{val.toLocaleString('tr-TR')}</Text>
        },
        {
            title: t("admin.common.date", "Tarih"),
            dataIndex: "created_at",
            key: "date",
            render: (date: string) => dayjs(date).format("DD.MM.YYYY HH:mm")
        }
    ];

    const tabItems = [
        {
            key: "edit",
            label: <Space><EditOutlined /> {t("admin.common.details", "Detaylar")}</Space>,
            children: (
                <CouponForm
                    initialValues={coupon}
                    mode={coupon.is_automatic ? "automatic" : "manual"}
                    onSave={handleSave}
                    saving={saving}
                    onBack={() => router.push("/admin/marketing/coupons")}
                />
            )
        },
        {
            key: "analytics",
            label: <Space><BarChartOutlined /> {t("admin.marketing.coupons.analytics", "Analiz ve İstatistik")}</Space>,
            children: (
                <div style={{ padding: 24 }}>
                    <Row gutter={[24, 24]}>
                        <Col span={8}>
                            <Card variant="borderless" style={{ background: "#f0fdf4", borderRadius: 12 }}>
                                <Statistic
                                    title={t("admin.marketing.coupons.stats.total_usage", "Kullanım Sayısı")}
                                    value={stats?.total_usage || 0}
                                    prefix={<HistoryOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card variant="borderless" style={{ background: "#fef2f2", borderRadius: 12 }}>
                                <Statistic
                                    title={t("admin.marketing.coupons.stats.total_discount", "Toplam İndirim")}
                                    value={stats?.total_discount || 0}
                                    prefix={<PercentageOutlined />}
                                    suffix="₺"
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card variant="borderless" style={{ background: "#eff6ff", borderRadius: 12 }}>
                                <Statistic
                                    title={t("admin.marketing.coupons.stats.total_sales", "Oluşturulan Satış")}
                                    value={stats?.total_sales || 0}
                                    prefix={<ShoppingCartOutlined />}
                                    suffix="₺"
                                />
                            </Card>
                        </Col>
                        <Col span={24}>
                            <Card title={t("admin.marketing.coupons.stats.usage_logs", "Kullanım Geçmişi")} variant="outlined" style={{ borderRadius: 12 }}>
                                <Table
                                    columns={logColumns}
                                    dataSource={logs}
                                    rowKey="id"
                                    loading={logsLoading}
                                />
                            </Card>
                        </Col>
                    </Row>
                </div>
            )
        }
    ];

    return (
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <Tabs
                defaultActiveKey={initialTab}
                items={tabItems}
                style={{ padding: "0 24px" }}
                className="custom-tabs"
            />
        </div>
    );
}
