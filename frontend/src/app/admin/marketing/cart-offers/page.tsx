'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, Select, App, Popconfirm, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { usePageHeader } from '@/hooks/usePageHeader';
import type { ColumnsType } from 'antd/es/table';

interface CartOffer {
    id: number;
    name: string;
    title: string | null;
    placement: string;
    trigger_type: string;
    is_active: boolean;
    used_count: number;
    starts_at: string | null;
    ends_at: string | null;
    priority: number;
    products_count?: number;
    usage_count?: number;
}

const placementLabels: Record<string, string> = {
    cart: 'Sepet Sayfası',
    checkout: 'Ödeme Sayfası',
    product_page: 'Ürün Detay',
    post_checkout: 'Sipariş Sonrası',
};

const triggerLabels: Record<string, string> = {
    all_products: 'Tüm Ürünler',
    specific_products: 'Belirli Ürünler',
    specific_categories: 'Belirli Kategoriler',
    cart_total: 'Sepet Tutarı',
};

export default function CartOffersPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [offers, setOffers] = useState<CartOffer[]>([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
    const [filters, setFilters] = useState({ search: '', placement: '', is_active: '' });

    usePageHeader({
        title: 'Sepet Teklifleri',
        breadcrumb: [
            { label: 'Anasayfa', href: '/admin' },
            { label: 'Otomasyonlar' },
            { label: 'Sepet Teklifleri' },
        ],
        extra: (
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/admin/marketing/cart-offers/new')}
            >
                Yeni Teklif Oluştur
            </Button>
        ),
    });

    const fetchOffers = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: pagination.pageSize.toString(),
                ...filters,
            });

            const data = await apiFetch<any>(`/api/marketing/cart-offers?${params}`);
            setOffers(data.data);
            setPagination({
                ...pagination,
                current: data.current_page,
                total: data.total,
            });
        } catch (error: any) {
            message.error(error.message || 'Teklifler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers(pagination.current);
    }, [filters]);

    const handleDelete = async (id: number) => {
        try {
            await apiFetch(`/api/marketing/cart-offers/${id}`, { method: 'DELETE' });
            message.success('Teklif başarıyla silindi');
            fetchOffers(pagination.current);
        } catch (error: any) {
            message.error(error.message || 'Silme işlemi başarısız');
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            await apiFetch(`/api/marketing/cart-offers/${id}/toggle-status`, { method: 'POST' });
            message.success(currentStatus ? 'Teklif pasif edildi' : 'Teklif aktif edildi');
            fetchOffers(pagination.current);
        } catch (error: any) {
            message.error(error.message || 'Durum değiştirme başarısız');
        }
    };

    const columns: ColumnsType<CartOffer> = [
        {
            title: 'Teklif Adı',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{text}</div>
                    {record.title && (
                        <div style={{ fontSize: 12, color: '#666' }}>{record.title}</div>
                    )}
                </div>
            ),
        },
        {
            title: 'Yerleşim',
            dataIndex: 'placement',
            key: 'placement',
            render: (placement) => (
                <Tag color="blue">{placementLabels[placement] || placement}</Tag>
            ),
        },
        {
            title: 'Tetikleyici',
            dataIndex: 'trigger_type',
            key: 'trigger_type',
            render: (type) => triggerLabels[type] || type,
        },
        {
            title: 'Kullanım',
            key: 'usage',
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{record.used_count} kez kullanıldı</div>
                    {record.starts_at && (
                        <div style={{ fontSize: 11, color: '#999' }}>
                            Başlangıç: {new Date(record.starts_at).toLocaleDateString()}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Öncelik',
            dataIndex: 'priority',
            key: 'priority',
            width: 80,
            align: 'center',
        },
        {
            title: 'Durum',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive, record) => (
                <Switch
                    checked={isActive}
                    onChange={() => handleToggleStatus(record.id, isActive)}
                    checkedChildren="Aktif"
                    unCheckedChildren="Pasif"
                />
            ),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => router.push(`/admin/marketing/cart-offers/${record.id}/edit`)}
                    />
                    <Popconfirm
                        title="Teklifi silmek istediğinize emin misiniz?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Evet"
                        cancelText="Hayır"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                <Input
                    placeholder="Teklif ara..."
                    prefix={<SearchOutlined />}
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    style={{ width: 300 }}
                />
                <Select
                    placeholder="Yerleşim"
                    value={filters.placement || undefined}
                    onChange={(value) => setFilters({ ...filters, placement: value || '' })}
                    style={{ width: 200 }}
                    allowClear
                >
                    <Select.Option value="cart">Sepet Sayfası</Select.Option>
                    <Select.Option value="checkout">Ödeme Sayfası</Select.Option>
                    <Select.Option value="product_page">Ürün Detay</Select.Option>
                    <Select.Option value="post_checkout">Sipariş Sonrası</Select.Option>
                </Select>
                <Select
                    placeholder="Durum"
                    value={filters.is_active || undefined}
                    onChange={(value) => setFilters({ ...filters, is_active: value || '' })}
                    style={{ width: 150 }}
                    allowClear
                >
                    <Select.Option value="1">Aktif</Select.Option>
                    <Select.Option value="0">Pasif</Select.Option>
                </Select>
            </div>

            <Table
                columns={columns}
                dataSource={offers}
                loading={loading}
                rowKey="id"
                pagination={{
                    ...pagination,
                    onChange: (page) => fetchOffers(page),
                }}
            />
        </div>
    );
}
