"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, Typography, Button, Space, Empty, Spin } from "antd";
import { EyeOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Order, PaginatedResponse, OrderStatus } from "@/types/order";

const { Text } = Typography;

interface CustomerOrderHistoryProps {
    customerId: number;
}

export function CustomerOrderHistory({ customerId }: CustomerOrderHistoryProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const loadOrders = async (page = 1) => {
        setLoading(true);
        try {
            const res = await apiFetch<PaginatedResponse<Order>>(`/api/customers/${customerId}/orders?page=${page}`);
            setOrders(res.data);
            setTotal(res.total);
            setCurrentPage(res.current_page);
        } catch (error) {
            console.error("Failed to load customer orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [customerId]);

    const statusColors: Record<OrderStatus, string> = {
        pending: "warning",
        confirmed: "processing",
        processing: "purple",
        shipped: "cyan",
        delivered: "success",
        cancelled: "error",
        refunded: "default",
    };

    const columns = [
        {
            title: t("admin.orders.columns.order_number", "Sipariş No"),
            dataIndex: "order_number",
            key: "order_number",
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: t("admin.orders.columns.date", "Tarih"),
            dataIndex: "created_at",
            key: "created_at",
            render: (date: string) => dayjs(date).format("DD.MM.YYYY HH:mm"),
        },
        {
            title: t("admin.orders.columns.status", "Durum"),
            dataIndex: "status",
            key: "status",
            render: (status: OrderStatus) => (
                <Tag color={statusColors[status]} style={{ borderRadius: 4 }}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: t("admin.orders.columns.total", "Toplam"),
            dataIndex: "grand_total",
            key: "grand_total",
            align: "right" as const,
            render: (total: number) => (
                <Text strong style={{ color: "#10b981" }}>
                    ₺{Number(total || 0).toFixed(2)}
                </Text>
            ),
        },
        {
            title: "",
            key: "actions",
            width: 50,
            render: (_: any, record: Order) => (
                <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => router.push(`/admin/orders/${record.id}`)}
                />
            ),
        },
    ];

    if (loading && orders.length === 0) {
        return (
            <div style={{ padding: "40px", textAlign: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!loading && orders.length === 0) {
        return (
            <Empty
                image={<ShoppingCartOutlined style={{ fontSize: 48, color: "#e2e8f0" }} />}
                description={t("admin.customers.detail.no_orders", "Henüz siparişi bulunmuyor")}
                style={{ padding: "40px 0" }}
            />
        );
    }

    return (
        <div style={{ padding: "12px" }}>
            <Table
                dataSource={orders}
                columns={columns}
                rowKey="id"
                size="small"
                loading={loading}
                pagination={{
                    current: currentPage,
                    total: total,
                    pageSize: 10,
                    onChange: (page) => loadOrders(page),
                    showSizeChanger: false,
                    size: "small",
                }}
            />
        </div>
    );
}
