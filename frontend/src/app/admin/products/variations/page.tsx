"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import {
    App, Button, Table, Tag,
    Space, Typography
} from "antd";
import {
    PlusOutlined, EditOutlined,
    DeleteOutlined, ExclamationCircleOutlined
} from "@ant-design/icons";
import { Variation, VariationValue } from "@/types/product";
import { usePageHeader } from "@/hooks/usePageHeader";

const { Text } = Typography;

export default function VariationsPage() {
    const { message, modal } = App.useApp();
    const [variations, setVariations] = useState<Variation[]>([]);
    const [loading, setLoading] = useState(false);

    // YAPBOZ: Varyant yönetimi header verileri
    const headerExtra = useMemo(() => (
        <Link href="/admin/products/variations/new">
            <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ height: 40, background: "#5E5CE6", borderColor: "#5E5CE6", fontWeight: 700, borderRadius: 8 }}
            >
                Yeni Varyant
            </Button>
        </Link>
    ), []);

    usePageHeader({
        title: "Varyant Yönetimi",
        variant: "light",
        extra: headerExtra
    });

    useEffect(() => {
        fetchVariations();
    }, []);

    const fetchVariations = async () => {
        try {
            setLoading(true);
            const data = await apiFetch<Variation[]>("/api/variations");
            setVariations(data);
        } catch (e: any) {
            message.error("Varyantlar yüklenirken hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        modal.confirm({
            title: 'Bu varyantı silmek istediğinize emin misiniz?',
            icon: <ExclamationCircleOutlined />,
            content: 'Bu işlem geri alınamaz.',
            okText: 'Sil',
            okType: 'danger',
            cancelText: 'Vazgeç',
            onOk: async () => {
                try {
                    await apiFetch(`/api/variations/${id}`, { method: "DELETE" });
                    message.success("Varyant silindi");
                    fetchVariations();
                } catch (e: any) {
                    message.error("Silme işlemi başarısız");
                }
            }
        });
    };

    const columns = [
        {
            title: "Varyant Adı",
            dataIndex: "name",
            key: "name",
            render: (text: string, record: Variation) => (
                <Link href={`/admin/products/variations/${record.id}/edit`}>
                    <Text strong style={{ color: '#0f172a', cursor: 'pointer' }}>{text}</Text>
                </Link>
            )
        },
        {
            title: "Tip",
            dataIndex: "type",
            key: "type",
            render: (type: string) => {
                const map: Record<string, string> = {
                    color: "purple",
                    image: "geekblue",
                    dropdown: "cyan",
                    button: "blue",
                    pill: "magenta",
                    radio: "orange",
                    text: "default",
                };
                return <Tag color={map[type] || "default"}>{String(type || "").toUpperCase()}</Tag>;
            }
        },
        {
            title: "Değerler",
            dataIndex: "values",
            key: "values",
            render: (values: VariationValue[]) => (
                <Space wrap>
                    {values.map(val => (
                        <Tag key={val.id}>{val.label}</Tag>
                    ))}
                </Space>
            )
        },
        {
            title: "",
            key: "actions",
            render: (_: any, record: Variation) => (
                <Space>
                    <Link href={`/admin/products/variations/${record.id}/edit`}>
                        <Button icon={<EditOutlined />} />
                    </Link>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    />
                </Space>
            )
        }
    ];

    return (
        <>
            <Table
                columns={columns}
                dataSource={variations}
                rowKey="id"
                loading={loading}
                pagination={false}
                bordered={false}
                className="ikas-style-table"
            />
            <style jsx global>{`
                .ikas-style-table {
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                }
                .ikas-style-table .ant-table-thead > tr > th {
                background: transparent !important;
                border-bottom: 1px solid #f1f5f9 !important;
                color: #64748b !important;
                font-weight: 600 !important;
                font-size: 13px !important;
                padding: 16px 8px !important;
                }
                .ikas-style-table .ant-table-tbody > tr > td {
                padding: 16px 8px !important;
                border-bottom: 1px solid #f8fafc !important;
                }
                .ikas-style-table .ant-table-tbody > tr:hover > td {
                background: #f8fafc !important;
                }
            `}</style>
        </>
    );
}
