"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
    Table,
    Button,
    Input,
    Space,
    Tag,
    Modal,
    Form,
    InputNumber,
    Select,
    DatePicker,
    Switch,
    Typography,
    App,
    Card,
    Tooltip,
    Row,
    Col,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    TagOutlined,
    ThunderboltOutlined,
    BarChartOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import { usePageHeader } from "@/hooks/usePageHeader";
import { useAuth, hasPermission } from "@/lib/auth";

const { Text } = Typography;

interface Coupon {
    id: number;
    name: string;
    code: string;
    type: "fixed" | "percentage";
    value: number;
    min_spend: number | null;
    usage_limit: number | null;
    usage_limit_per_customer: number | null;
    used_count: number;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    description: string | null;
    created_at: string;
}

export default function CouponsPage() {
    const { message, modal } = App.useApp();
    const { me } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [search, setSearch] = useState("");
    const [selectionModalOpen, setSelectionModalOpen] = useState(false);

    const loadCoupons = async (page = 1, searchStr = search) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                per_page: pagination.pageSize.toString(),
                search: searchStr,
            });
            const res = await apiFetch<any>(`/api/marketing/coupons?${query}`);
            setCoupons(res.data);
            setPagination({
                ...pagination,
                current: res.current_page,
                total: res.total,
            });
        } catch (error) {
            message.error(t("admin.marketing.coupons.load_failed", "Kuponlar yüklenemedi"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCoupons();
    }, []);

    const handleSearch = (v: string) => {
        setSearch(v);
        loadCoupons(1, v);
    };

    const handleAdd = () => {
        setSelectionModalOpen(true);
    };

    const handleSelectType = (isAutomatic: boolean) => {
        setSelectionModalOpen(false);
        router.push(`/admin/marketing/coupons/new?mode=${isAutomatic ? "automatic" : "manual"}`);
    };

    const handleEdit = (coupon: Coupon) => {
        router.push(`/admin/marketing/coupons/${coupon.id}`);
    };

    const handleDelete = (coupon: Coupon) => {
        modal.confirm({
            title: t("admin.common.are_you_sure", "Emin misiniz?"),
            content: t("admin.marketing.coupons.delete_confirm", "Bu kuponu silmek istediğinize emin misiniz?"),
            okText: t("admin.common.yes", "Evet"),
            okType: "danger",
            cancelText: t("admin.common.no", "Hayır"),
            onOk: async () => {
                try {
                    await apiFetch(`/api/marketing/coupons/${coupon.id}`, { method: "DELETE" });
                    message.success(t("admin.marketing.coupons.delete_success", "Kupon silindi"));
                    loadCoupons(pagination.current);
                } catch (error: any) {
                    message.error(error.message || t("admin.common.error", "Bir hata oluştu"));
                }
            },
        });
    };

    const headerExtra = useMemo(() => (
        <Space>
            <Input
                placeholder={t("admin.marketing.coupons.search_placeholder", "Kupon adı veya kod ile ara...")}
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                style={{ width: 300, borderRadius: 8 }}
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={() => handleSearch(search)}
            />
            {hasPermission(me, "coupons.create") && (
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    style={{ borderRadius: 8, height: 40, padding: "0 24px" }}
                >
                    {t("admin.marketing.coupons.new_coupon", "Yeni Kupon")}
                </Button>
            )}
            <Button
                icon={<BarChartOutlined />}
                onClick={() => router.push("/admin/marketing/coupons/reports")}
                style={{ borderRadius: 8, height: 40 }}
            >
                {t("admin.marketing.coupons.reports.btn", "Raporlar")}
            </Button>
        </Space>
    ), [me, search]);

    usePageHeader({
        title: t("admin.marketing.coupons.title", "İndirim Kuponları"),
        extra: headerExtra,
    });

    const columns = [
        {
            title: t("admin.marketing.coupons.columns.name", "Kupon Adı"),
            dataIndex: "name",
            key: "name",
            render: (text: string, record: Coupon) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.description || "-"}</Text>
                </Space>
            ),
        },
        {
            title: t("admin.marketing.coupons.columns.code", "Kod"),
            dataIndex: "code",
            key: "code",
            render: (code: string) => (
                <Tag color="blue" style={{ fontSize: 13, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                    {code}
                </Tag>
            ),
        },
        {
            title: t("admin.marketing.coupons.columns.value", "Değer"),
            key: "value",
            render: (_: any, record: Coupon) => (
                <Text strong>
                    {record.type === "percentage" ? `%${record.value}` : `₺${record.value}`}
                </Text>
            ),
        },
        {
            title: t("admin.marketing.coupons.columns.usage", "Kullanım"),
            key: "usage",
            render: (_: any, record: Coupon) => (
                <Space direction="vertical" size={0}>
                    <Text>{record.used_count} / {record.usage_limit || "∞"}</Text>
                    {record.usage_limit_per_customer && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            Max: {record.usage_limit_per_customer} / müşteri
                        </Text>
                    )}
                </Space>
            ),
        },
        {
            title: t("admin.marketing.coupons.columns.dates", "Geçerlilik"),
            key: "dates",
            render: (_: any, record: Coupon) => {
                if (!record.start_date && !record.end_date) return t("admin.common.unlimited", "Süresiz");
                return (
                    <Text style={{ fontSize: 12 }}>
                        {record.start_date ? dayjs(record.start_date).format("DD.MM.YY") : "..."} - {record.end_date ? dayjs(record.end_date).format("DD.MM.YY") : t("admin.common.unlimited", "Süresiz")}
                    </Text>
                );
            },
        },
        {
            title: t("admin.common.status", "Durum"),
            dataIndex: "is_active",
            key: "is_active",
            render: (active: boolean, record: Coupon) => {
                const now = dayjs();
                const expired = record.end_date && now.isAfter(dayjs(record.end_date));
                const notStarted = record.start_date && now.isBefore(dayjs(record.start_date));
                const limitReached = record.usage_limit && record.used_count >= record.usage_limit;

                if (!active) return <Tag color="default">{t("admin.common.passive", "Pasif")}</Tag>;
                if (expired) return <Tag color="error">{t("admin.marketing.coupons.status.expired", "Süresi Doldu")}</Tag>;
                if (notStarted) return <Tag color="warning">{t("admin.marketing.coupons.status.not_started", "Beklemede")}</Tag>;
                if (limitReached) return <Tag color="error">{t("admin.marketing.coupons.status.limit_reached", "Limit Doldu")}</Tag>;

                return <Tag color="success">{t("admin.common.active", "Aktif")}</Tag>;
            },
        },
        {
            title: t("admin.common.actions", "İşlemler"),
            key: "actions",
            width: 120,
            align: "right" as const,
            render: (_: any, record: Coupon) => (
                <Space>
                    {hasPermission(me, "coupons.edit") && (
                        <Tooltip title={t("admin.common.edit", "Düzenle")}>
                            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                        </Tooltip>
                    )}
                    {hasPermission(me, "coupons.destroy") && (
                        <Tooltip title={t("admin.common.delete", "Sil")}>
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card variant="borderless" style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
                <Table
                    columns={columns}
                    dataSource={coupons}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        onChange: (page) => loadCoupons(page),
                    }}
                />
            </Card>


            <Modal
                title={t("admin.marketing.coupons.select_type", "İndirim Türü Seçin")}
                open={selectionModalOpen}
                onCancel={() => setSelectionModalOpen(false)}
                footer={null}
                width={700}
                centered
            >
                <Row gutter={24} style={{ padding: '20px 0' }}>
                    <Col span={12}>
                        <Card
                            hoverable
                            style={{ height: '100%', textAlign: 'center', borderColor: '#d9d9d9' }}
                            onClick={() => handleSelectType(false)}
                        >
                            <div style={{ fontSize: 40, color: '#6f55ff', marginBottom: 16 }}>
                                <TagOutlined />
                            </div>
                            <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                                {t("admin.marketing.coupons.type_manual", "Kupon Kodu")}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                {t("admin.marketing.coupons.type_manual_desc", "Müşterilerin ödeme aşamasında girdiği indirim kodları oluşturun.")}
                            </Text>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card
                            hoverable
                            style={{ height: '100%', textAlign: 'center', borderColor: '#d9d9d9' }}
                            onClick={() => handleSelectType(true)}
                        >
                            <div style={{ fontSize: 40, color: '#f5222d', marginBottom: 16 }}>
                                <ThunderboltOutlined />
                            </div>
                            <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                                {t("admin.marketing.coupons.type_auto", "Otomatik İndirim")}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                {t("admin.marketing.coupons.type_auto_desc", "Sepette veya ödeme aşamasında otomatik uygulanan kampanyalar.")}
                            </Text>
                        </Card>
                    </Col>
                </Row>
            </Modal>
        </>
    );
}
