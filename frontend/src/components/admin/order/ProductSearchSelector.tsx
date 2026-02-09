"use client";

import React, { useState, useEffect } from "react";
import { Select, Avatar, Spin, Typography, Space, Tag } from "antd";
import { SearchOutlined, ShoppingOutlined } from "@ant-design/icons";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";

const { Text } = Typography;

interface ProductSearchSelectorProps {
    onSelect: (product: any) => void;
}

export function ProductSearchSelector({ onSelect }: ProductSearchSelectorProps) {
    const [fetching, setFetching] = useState(false);
    const [options, setOptions] = useState<any[]>([]);

    const fetchProducts = async (q: string) => {
        setFetching(true);
        try {
            // Using index with search if possible, else might need a search endpoint
            // For now let's assume index handles search or we add it later
            const res = await apiFetch<any>(`/api/products?search=${encodeURIComponent(q)}`);
            setOptions(res.data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setFetching(false);
        }
    };

    const handleSearch = (newValue: string) => {
        if (newValue) {
            fetchProducts(newValue);
        }
    };

    const handleChange = (productId: number) => {
        const product = options.find((p) => p.id === productId);
        if (product) {
            onSelect(product);
        }
    };

    return (
        <Select
            showSearch
            placeholder={t("admin.orders.search_product", "Ürün ara (İsim, SKU)...")}
            notFoundContent={fetching ? <Spin size="small" /> : null}
            filterOption={false}
            onSearch={handleSearch}
            onChange={handleChange}
            style={{ width: "100%" }}
            size="large"
            suffixIcon={<SearchOutlined />}
            options={options.map((p) => ({
                label: (
                    <Space>
                        <Avatar
                            shape="square"
                            size="small"
                            src={p.media?.[0]?.path}
                            icon={<ShoppingOutlined />}
                        />
                        <div>
                            <Text strong>{p.name}</Text>
                            <br />
                            <Space size={4}>
                                <Text type="secondary" style={{ fontSize: 11 }}>SKU: {p.sku || '-'}</Text>
                                <Tag color="blue">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.selling_price)}</Tag>
                                {p.variants?.length > 0 && <Tag color="purple">{p.variants.length} Varyant</Tag>}
                            </Space>
                        </div>
                    </Space>
                ),
                value: p.id,
            }))}
        />
    );
}
