"use client";

import React, { useEffect, useState } from "react";
import {
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Typography,
    Space,
    Tag,
    Spin,
    Button,
    ConfigProvider
} from "antd";
import {
    ShoppingCartOutlined,
    BarChartOutlined,
    PercentageOutlined,
    RiseOutlined,
    CalendarOutlined,
    LineChartOutlined
} from "@ant-design/icons";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import { usePageHeader } from "@/hooks/usePageHeader";
import { useRouter } from "next/navigation";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface CouponSummary {
    total_discount_given: number;
    total_usage_count: number;
}

interface TopCoupon {
    coupon_id: number;
    usage_count: number;
    total_discount: number;
    coupon: {
        id: number;
        name: string;
        code: string;
        type: string;
    };
}

interface TrendData {
    date: string;
    count: number;
    amount: number;
}

export default function CouponReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        summary: CouponSummary,
        top_coupons: TopCoupon[],
        usage_trend: TrendData[]
    } | null>(null);

    usePageHeader({
        title: t("admin.marketing.coupons.reports.title", "Kampanya Performans Raporları"),
        onBack: () => router.push("/admin/marketing/coupons"),
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiFetch<any>("/api/marketing/coupons/all-statistics");
            setData(res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: 100, textAlign: 'center' }}><Spin size="large" /></div>;

    const columns = [
        {
            title: t("admin.marketing.coupons.columns.name", "Kampanya"),
            key: "coupon",
            render: (_: any, record: TopCoupon) => (
                <Space size={12}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: "#f0f0f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        color: "#6366f1"
                    }}>
                        <PercentageOutlined />
                    </div>
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 13.5 }}>{record.coupon?.name || t("admin.marketing.coupons.reports.deleted_coupon", "Silinmiş Kupon")}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{record.coupon?.code || "N/A"}</Text>
                    </Space>
                </Space>
            )
        },
        {
            title: t("admin.marketing.coupons.columns.usage", "Toplam Kullanım"),
            dataIndex: "usage_count",
            key: "usage_count",
            sorter: (a: any, b: any) => a.usage_count - b.usage_count,
            render: (count: number) => (
                <Space size={4}>
                    <Text strong style={{ fontSize: 13 }}>{count}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{t("admin.marketing.coupons.reports.times", "kez")}</Text>
                </Space>
            )
        },
        {
            title: t("admin.marketing.coupons.columns.total_discount", "Sağlanan İndirim"),
            dataIndex: "total_discount",
            key: "total_discount",
            render: (val: number) => (
                <Text strong style={{ fontSize: 13, color: "#10b981" }}>₺{val.toLocaleString('tr-TR')}</Text>
            )
        },
        {
            title: t("admin.common.actions", "Detay"),
            key: "actions",
            align: "right" as const,
            render: (_: any, record: TopCoupon) => (
                <Button
                    type="text"
                    onClick={() => router.push(`/admin/marketing/coupons/${record.coupon_id}?tab=analytics`)}
                    style={{ color: "#6366f1", fontWeight: 500 }}
                >
                    {t("admin.marketing.coupons.reports.details", "Analiz")}
                </Button>
            )
        }
    ];

    const chartData = data?.usage_trend?.map(item => ({
        ...item,
        displayDate: dayjs(item.date).format("DD MMM")
    })) || [];

    return (
        <div style={{ padding: "0 24px 24px" }}>
            <Row gutter={[20, 20]}>
                {/* Stats Row */}
                <Col span={8}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: 12,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0"
                        }}
                        bodyStyle={{ padding: "20px 24px" }}
                    >
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eef2ff", display: 'flex', alignItems: 'center', justifyContent: 'center', color: "#6366f1" }}>
                                    <RiseOutlined />
                                </div>
                                <Text type="secondary" style={{ fontSize: 11 }}>{t("admin.marketing.coupons.reports.last_30_days", "Son 30 Gün")}</Text>
                            </div>
                            <Statistic
                                title={<Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>{t("admin.marketing.coupons.stats.total_discount", "Toplam Sağlanan İndirim")}</Text>}
                                value={data?.summary?.total_discount_given || 0}
                                precision={2}
                                suffix="₺"
                                valueStyle={{ fontSize: 24, fontWeight: 700, color: "#111827" }}
                            />
                        </Space>
                    </Card>
                </Col>

                <Col span={8}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: 12,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0"
                        }}
                        bodyStyle={{ padding: "20px 24px" }}
                    >
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ecfdf5", display: 'flex', alignItems: 'center', justifyContent: 'center', color: "#10b981" }}>
                                    <ShoppingCartOutlined />
                                </div>
                                <Text type="secondary" style={{ fontSize: 11 }}>{t("admin.marketing.coupons.reports.lifetime", "Ömür Boyu")}</Text>
                            </div>
                            <Statistic
                                title={<Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>{t("admin.marketing.coupons.stats.total_usages", "Toplam Kupon Kullanımı")}</Text>}
                                value={data?.summary?.total_usage_count || 0}
                                valueStyle={{ fontSize: 24, fontWeight: 700, color: "#111827" }}
                                suffix={<Text type="secondary" style={{ fontSize: 14, fontWeight: 400, marginLeft: 4 }}>{t("admin.marketing.coupons.reports.unit", "adet")}</Text>}
                            />
                        </Space>
                    </Card>
                </Col>

                <Col span={8}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: 12,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
                        }}
                        bodyStyle={{ padding: "20px 24px" }}
                    >
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.1)", display: 'flex', alignItems: 'center', justifyContent: 'center', color: "#fff" }}>
                                    <CalendarOutlined />
                                </div>
                                <Tag color="blue" bordered={false} style={{ fontSize: 10 }}>{t("admin.marketing.coupons.reports.live", "Canlı")}</Tag>
                            </div>
                            <div>
                                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, display: 'block' }}>{t("admin.marketing.coupons.reports.active_campaigns", "Aktif Kampanyalar")}</Text>
                                <Text style={{ color: "#fff", fontSize: 24, fontWeight: 700 }}>{data?.top_coupons?.length || 0}</Text>
                                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginLeft: 8 }}>{t("admin.marketing.coupons.reports.campaign", "Kampanya")}</Text>
                            </div>
                        </Space>
                    </Card>
                </Col>

                {/* Chart Section */}
                <Col span={24}>
                    <Card
                        title={
                            <Space size={12}>
                                <LineChartOutlined style={{ color: "#6366f1" }} />
                                <Text strong style={{ fontSize: 15 }}>{t("admin.marketing.coupons.reports.trend_title", "İndirim Kullanım Trendi (Son 30 Gün)")}</Text>
                            </Space>
                        }
                        variant="borderless"
                        style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #f0f0f0" }}
                    >
                        <div style={{ width: '100%', height: 300, marginTop: 10 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="displayDate"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                        name={t("admin.marketing.coupons.reports.usage_count_label", "Kullanım Sayısı")}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                {/* Performance Table */}
                <Col span={24}>
                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "4px 0" }}>
                                <Space size={12}>
                                    <BarChartOutlined style={{ color: "#6366f1" }} />
                                    <Text strong style={{ fontSize: 15 }}>{t("admin.marketing.coupons.reports.top_performing", "En İyi Performans Gösteren Kampanyalar")}</Text>
                                </Space>
                            </div>
                        }
                        variant="borderless"
                        style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #f0f0f0" }}
                        bodyStyle={{ padding: 0 }}
                    >
                        <Table
                            columns={columns}
                            dataSource={data?.top_coupons || []}
                            rowKey="coupon_id"
                            pagination={false}
                            className="ikas-report-table"
                            rowClassName="ikas-row-hover"
                        />
                    </Card>
                </Col>
            </Row>

            <style jsx global>{`
                .ikas-report-table .ant-table-thead > tr > th {
                    background: #f9fafb !important;
                    font-size: 11px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    color: #6b7280 !important;
                    border-bottom: 1px solid #f0f0f0 !important;
                    padding: 12px 24px !important;
                }
                .ikas-report-table .ant-table-tbody > tr > td {
                    padding: 16px 24px !important;
                    border-bottom: 1px solid #f9fafb !important;
                }
                .ikas-row-hover:hover td {
                    background: #fcfcfc !important;
                }
                .ant-statistic-title {
                    margin-bottom: 4px !important;
                }
            `}</style>
        </div>
    );
}
