
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    Table,
    Tag,
    Button,
    Space,
    Input,
    Select,
    Card,
    Typography,
    Row,
    Col,
    App,
    Dropdown,
    Avatar,
    Form,
    Modal,
} from "antd";
import {
    SearchOutlined,
    PlusOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    MoreOutlined,
    ReloadOutlined,
    MailOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth, hasPermission } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { usePageHeader } from "@/hooks/usePageHeader";
import type { Customer, PaginatedResponse } from "@/types/order";

export default function CustomersPage() {
    const router = useRouter();
    const { message, modal } = App.useApp();
    const { me } = useAuth();
    const { Text } = Typography;

    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

    // Filters
    const [search, setSearch] = useState("");
    const [groupFilter, setGroupFilter] = useState<string>("");

    // Load customers
    const loadCustomers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("per_page", String(pagination.pageSize));
            if (search) params.set("search", search);
            if (groupFilter) params.set("group", groupFilter);

            const res = await apiFetch<PaginatedResponse<Customer>>(`/api/customers?${params}`);
            setCustomers(res.data);
            setPagination(prev => ({ ...prev, current: res.current_page, total: res.total }));
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : t("admin.customers.list.load_failed", "Müşteriler yüklenemedi");
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [search, groupFilter, pagination.pageSize, message]);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    // Global Header - Extra buttons
    const headerExtra = useMemo(() => (
        <Space size={12}>
            <Button
                icon={<ReloadOutlined />}
                onClick={() => loadCustomers()}
                style={{ borderRadius: 8 }}
            />
            {hasPermission(me, "customers.create") && (
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => router.push("/admin/customers/new")}
                    style={{
                        background: "#5E5CE6",
                        borderColor: "#5E5CE6",
                        borderRadius: 8,
                        fontWeight: 600,
                        padding: "0 20px",
                    }}
                >
                    {t("admin.customers.new_customer", "Yeni Müşteri")}
                </Button>
            )}
        </Space>
    ), [me, loadCustomers]);

    // Set global header
    usePageHeader({
        title: t("admin.customers.title", "Müşteriler"),
        extra: headerExtra,
    });

    // Delete customer
    const deleteCustomer = async (customer: Customer) => {
        modal.confirm({
            title: t("admin.customers.delete_title", "Müşteriyi Sil"),
            content: t("admin.customers.delete_confirm", ":name müşterisini silmek istediğinize emin misiniz?").replace(":name", customer.full_name),
            okText: t("admin.common.delete", "Sil"),
            okType: "danger",
            cancelText: t("admin.common.cancel", "İptal"),
            onOk: async () => {
                try {
                    await apiFetch(`/api/customers/${customer.id}`, { method: "DELETE" });
                    message.success(t("admin.customers.delete_success", "Müşteri silindi"));
                    loadCustomers();
                } catch (e: unknown) {
                    const errorMessage = e instanceof Error ? e.message : t("admin.customers.delete_failed", "Silme başarısız");
                    message.error(errorMessage);
                }
            },
        });
    };

    // Group labels
    const groupLabels: Record<string, { label: string; color: string }> = {
        normal: { label: t("admin.customers.group.normal", "Normal"), color: "default" },
        vip: { label: t("admin.customers.group.vip", "VIP"), color: "gold" },
        wholesale: { label: t("admin.customers.group.wholesale", "Toptancı"), color: "blue" },
    };

    const columns = [
        {
            title: t("admin.customers.columns.customer", "Müşteri"),
            key: "customer",
            width: 280,
            render: (_: unknown, record: Customer) => (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar
                        size={40}
                        style={{
                            background: record.group === "vip" ? "#f59e0b" : record.group === "wholesale" ? "#3b82f6" : "#5E5CE6"
                        }}
                    >
                        {record.first_name?.[0]}{record.last_name?.[0]}
                    </Avatar>
                    <div>
                        <Typography.Text strong style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/customers/${record.id}/edit`)}>
                            {record.full_name}
                        </Typography.Text>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                            <MailOutlined style={{ marginRight: 4 }} />{record.email}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: t("admin.customers.columns.phone", "Telefon"),
            dataIndex: "phone",
            width: 140,
            render: (v: string) => v || <Typography.Text type="secondary">-</Typography.Text>,
        },
        {
            title: t("admin.customers.columns.group", "Grup"),
            dataIndex: "group",
            width: 100,
            render: (v: string) => (
                <Tag color={groupLabels[v]?.color || "default"}>{groupLabels[v]?.label || v}</Tag>
            ),
        },
        {
            title: t("admin.customers.columns.orders", "Siparişler"),
            dataIndex: "total_orders",
            width: 100,
            align: "center" as const,
            render: (v: number) => <Tag color="blue">{v}</Tag>,
        },
        {
            title: t("admin.customers.columns.total_spent", "Toplam Harcama"),
            dataIndex: "total_spent",
            width: 140,
            align: "right" as const,
            render: (v: any) => (
                <Typography.Text strong style={{ color: "#10b981" }}>
                    ₺{Number(v || 0).toFixed(2)}
                </Typography.Text>
            ),
        },
        {
            title: t("admin.customers.columns.registered", "Kayıt"),
            dataIndex: "created_at",
            width: 120,
            render: (v: string) => dayjs(v).format("DD MMM YYYY"),
        },
        {
            title: "",
            key: "actions",
            width: 60,
            render: (_: unknown, record: Customer) => (
                <Dropdown
                    menu={{
                        items: [
                            { key: "view", label: t("admin.common.view", "Görüntüle"), icon: <EyeOutlined />, disabled: !hasPermission(me, "customers.index") },
                            { key: "edit", label: t("admin.common.edit", "Düzenle"), icon: <EditOutlined />, disabled: !hasPermission(me, "customers.edit") },
                            { type: "divider" },
                            { key: "delete", label: t("admin.common.delete", "Sil"), icon: <DeleteOutlined />, danger: true, disabled: !hasPermission(me, "customers.destroy") },
                        ],
                        onClick: ({ key }) => {
                            if (key === "view" || key === "edit") {
                                router.push(`/admin/customers/${record.id}/edit`);
                            } else if (key === "delete") {
                                deleteCustomer(record);
                            }
                        },
                    }}
                    trigger={["click"]}
                >
                    <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
            ),
        },
    ];

    return (
        <>
            {/* Filters */}
            <Card size="small" style={{ borderRadius: 12, border: "1px solid #f0f0f5", marginBottom: 24 }}>
                <Row gutter={16} align="middle">
                    <Col flex="1">
                        <Input
                            placeholder={t("admin.customers.search_placeholder", "İsim, e-posta veya telefon ara...")}
                            prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onPressEnter={() => loadCustomers(1)}
                            style={{ borderRadius: 8 }}
                            allowClear
                        />
                    </Col>
                    <Col>
                        <Select
                            placeholder={t("admin.customers.filter.group", "Müşteri Grubu")}
                            value={groupFilter || undefined}
                            onChange={(v) => setGroupFilter(v || "")}
                            style={{ width: 150 }}
                            allowClear
                            options={[
                                { value: "normal", label: t("admin.customers.group.normal", "Normal") },
                                { value: "vip", label: t("admin.customers.group.vip", "VIP") },
                                { value: "wholesale", label: t("admin.customers.group.wholesale", "Toptancı") },
                            ]}
                        />
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={() => loadCustomers(1)}
                            style={{ borderRadius: 8 }}
                        >
                            {t("admin.common.search", "Ara")}
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Customers Table */}
            <Card
                size="small"
                style={{ borderRadius: 12, border: "1px solid #f0f0f5" }}
                styles={{ body: { padding: 0 } }}
            >
                <Table
                    dataSource={customers}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total) => t("admin.customers.pagination.total", "Toplam :count müşteri").replace(":count", String(total)),
                        onChange: (page, pageSize) => {
                            setPagination(prev => ({ ...prev, current: page, pageSize }));
                            loadCustomers(page);
                        },
                    }}
                    style={{ borderRadius: 12 }}
                />
            </Card>
        </>
    );
}
