"use client";

import { usePageHeader } from "@/hooks/usePageHeader";
import { App, Button, Popconfirm, Space, Table } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function AttributeSetsPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);

    usePageHeader({
        title: "Özellik Setleri",
        breadcrumb: [
            { label: "Ana Sayfa", href: "/admin" },
            { label: "Özellik Setleri" },
        ],
        extra: [
            <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push("/admin/attribute-sets/new")}
                style={{ background: "#6f55ff", borderColor: "#6f55ff", fontWeight: 700, height: 40, borderRadius: 8 }}
            >
                Yeni Set
            </Button>
        ]
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await apiFetch<any[]>("/api/attribute-sets");
            setData(Array.isArray(res) ? res : []);
        } catch (e: any) {
            message.error(e?.message || "Yüklenemedi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await apiFetch(`/api/attribute-sets/${id}`, { method: "DELETE" });
            message.success("Silindi");
            fetchData();
        } catch (e: any) {
            message.error(e?.message || "Silinemedi");
        }
    };

    const columns: any[] = [
        { title: "ID", dataIndex: "id", width: 90 },
        { title: "Ad", dataIndex: "name" },
        {
            title: "Özellik Sayısı",
            render: (_: any, row: any) => Array.isArray(row?.attributes) ? row.attributes.length : 0,
            width: 160,
        },
        {
            title: "İşlemler",
            width: 140,
            render: (_: any, row: any) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => router.push(`/admin/attribute-sets/${row.id}`)} />
                    <Popconfirm title="Silinsin mi?" onConfirm={() => handleDelete(row.id)} okText="Evet" cancelText="Hayır">
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Table rowKey="id" loading={loading} dataSource={data} columns={columns} pagination={{ pageSize: 20 }} />
        </div>
    );
}
