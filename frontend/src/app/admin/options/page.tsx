"use client";

import { usePageHeader } from "@/hooks/usePageHeader";
import { Button, Table, Tag, Space, Popconfirm, App } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";

export default function OptionsPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<any[]>([]);

    usePageHeader({
        title: t('admin.options.title', 'Seçenekler'),
        breadcrumb: [
            { label: t('admin.common.home', 'Ana Sayfa'), href: "/admin" },
            { label: t('admin.options.title', 'Seçenekler') },
        ],
        extra: [
            <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push("/admin/options/new")}
                style={{ background: "#6f55ff", borderColor: "#6f55ff", fontWeight: 700, height: 40, borderRadius: 8 }}
            >
                {t('admin.options.add_button', 'Yeni Seçenek Ekle')}
            </Button>
        ]
    });

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            setLoading(true);
            const data = await apiFetch<any[]>("/api/options");
            setOptions(data);
        } catch (e: any) {
            message.error(e.message || t('admin.options.load_failed', 'Seçenekler yüklenirken hata oluştu'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await apiFetch(`/api/options/${id}`, { method: "DELETE" });
            message.success(t('admin.options.delete_success', 'Seçenek silindi'));
            fetchOptions();
        } catch (e: any) {
            message.error(e.message || t('admin.options.delete_failed', 'Silme işlemi başarısız'));
        }
    };

    const columns = [
        {
            title: t('admin.common.id', 'ID'),
            dataIndex: "id",
            width: 80,
        },
        {
            title: t('admin.options.columns.name', 'Seçenek Adı'),
            dataIndex: "name",
            render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
        },
        {
            title: t('admin.options.columns.type', 'Türü'),
            dataIndex: "type",
            render: (type: string) => {
                const map: Record<string, string> = {
                    dropdown: t('admin.options.types.dropdown', 'Açılır Liste'),
                    checkbox: t('admin.options.types.checkbox', 'Onay Kutusu'),
                    radio: t('admin.options.types.radio', 'Radyo Butonu'),
                    multiple_select: t('admin.options.types.multiple_select', 'Çoklu Seçim'),
                    date: t('admin.options.types.date', 'Tarih'),
                    time: t('admin.options.types.time', 'Saat'),
                    text: t('admin.options.types.text', 'Metin'),
                    textarea: t('admin.options.types.textarea', 'Metin Alanı'),
                };
                return <Tag>{map[type] || type}</Tag>;
            }
        },
        {
            title: t('admin.options.columns.is_required', 'Zorunlu'),
            dataIndex: "is_required",
            render: (req: boolean) => (
                <Tag color={req ? "red" : "default"}>
                    {req ? t('admin.common.required', 'Zorunlu') : t('admin.common.optional', 'Opsiyonel')}
                </Tag>
            )
        },
        {
            title: t('admin.common.actions', 'İşlemler'),
            key: "actions",
            width: 120,
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => router.push(`/admin/options/${record.id}`)}
                    />
                    <Popconfirm
                        title={t('admin.common.confirm_delete', 'Silmek istediğinize emin misiniz?')}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t('admin.common.yes', 'Evet')}
                        cancelText={t('admin.common.no', 'Hayır')}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Table
                columns={columns}
                dataSource={options}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 20,
                    showTotal: (total) => t('admin.options.list.total', 'Toplam :count seçenek').replace(':count', total.toString()),
                }}
            />
        </div>
    );
}
