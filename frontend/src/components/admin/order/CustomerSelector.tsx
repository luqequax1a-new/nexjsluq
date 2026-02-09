"use client";

import React, { useState, useEffect } from "react";
import { Select, Avatar, Spin, Typography, Space, Button, Divider } from "antd";
import { UserOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Customer } from "@/types/order";

const { Text } = Typography;

interface CustomerSelectorProps {
    value?: number;
    onChange?: (customerId: number, customer: Customer) => void;
    onAddNew?: () => void;
}

export function CustomerSelector({ value, onChange, onAddNew }: CustomerSelectorProps) {
    const [fetching, setFetching] = useState(false);
    const [options, setOptions] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");

    const fetchCustomers = async (q: string) => {
        setFetching(true);
        try {
            const res = await apiFetch<Customer[]>(`/api/customers/search?q=${encodeURIComponent(q)}`);
            setOptions(res);
        } catch (error) {
            console.error("Failed to fetch customers", error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchCustomers("");
    }, []);

    const handleSearch = (newValue: string) => {
        setSearch(newValue);
        fetchCustomers(newValue);
    };

    const handleChange = (customerId: number) => {
        const customer = options.find((c) => c.id === customerId);
        if (customer && onChange) {
            onChange(customerId, customer);
        }
    };

    return (
        <Select
            showSearch
            value={value}
            placeholder={t("admin.orders.select_customer", "Müşteri Seçin...")}
            notFoundContent={fetching ? <Spin size="small" /> : null}
            filterOption={false}
            onSearch={handleSearch}
            onChange={handleChange}
            style={{ width: "100%" }}
            size="large"
            suffixIcon={<SearchOutlined />}
            popupRender={(menu) => (
                <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={onAddNew}
                        style={{ width: "100%", textAlign: "left" }}
                    >
                        {t("admin.customers.new_customer", "Yeni Müşteri Ekle")}
                    </Button>
                </>
            )}
            options={options.map((c) => ({
                label: (
                    <Space>
                        <Avatar size="small" icon={<UserOutlined />} style={{ background: c.group === 'vip' ? '#f59e0b' : '#5E5CE6' }} />
                        <div>
                            <Text strong>{c.full_name}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 11 }}>{c.email} | {c.phone || '-'}</Text>
                        </div>
                    </Space>
                ),
                value: c.id,
            }))}
        />
    );
}
