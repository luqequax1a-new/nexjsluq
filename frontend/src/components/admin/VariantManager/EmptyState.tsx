"use client";

import { Empty, Button, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

interface VariantEmptyStateProps {
    onAdd: () => void;
}

export function VariantEmptyState({ onAdd }: VariantEmptyStateProps) {
    return (
        <div style={{
            padding: "32px",
            textAlign: "center",
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px dashed #cbd5e1",
            color: "#64748b",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
        }}>
            <Title level={5} style={{ marginBottom: 4, fontWeight: 600, fontSize: 15, color: "#475569" }}>
                Henüz bir varyant eklemediniz.
            </Title>
            <Text type="secondary" style={{ marginBottom: 20, fontSize: 13 }}>
                Renk, boyut gibi ürün varyantı ekleyiniz.
            </Text>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAdd}
                style={{
                    borderRadius: 6,
                    backgroundColor: "#5E5CE6",
                    fontWeight: 500
                }}
            >
                Varyant Ekle
            </Button>
        </div>
    );
}
