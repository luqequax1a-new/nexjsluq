'use client';

import { useState, useEffect, useMemo } from 'react';
import { App, Button, Table, Space, Input, Switch, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getBrands, deleteBrand } from '@/lib/api/brands';
import { Brand } from '@/types/brand';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useAuth, hasPermission } from '@/lib/auth';
import { t } from '@/lib/i18n';
import '../categories/categories.css';

export default function BrandsPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const { me } = useAuth();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    const canCreate = hasPermission(me, 'brands.create');
    const canEdit = hasPermission(me, 'brands.edit');
    const canDelete = hasPermission(me, 'brands.destroy');

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const response = await getBrands({ paginate: false });
            setBrands(Array.isArray(response) ? response : response.brands || []);
        } catch (error) {
            message.error(t('admin.brands.load_failed', 'Markalar yüklenemedi'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await deleteBrand(id);
            message.success(t('admin.brands.deleted', 'Marka silindi'));
            fetchBrands();
        } catch (error) {
            message.error(t('admin.brands.delete_failed', 'Marka silinemedi'));
        }
    };

    const filteredBrands = brands.filter(brand =>
        brand.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const headerExtra = useMemo(() => (
        canCreate ? (
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/admin/brands/new')}
                style={{ background: "#5E5CE6", borderColor: "#5E5CE6", fontWeight: 700, height: 40, borderRadius: 8 }}
            >
                {t('admin.brands.add_button', 'Marka Ekle')}
            </Button>
        ) : null
    ), [router, canCreate]);

    usePageHeader({
        title: t('admin.brands.title', 'Markalar'),
        variant: "light",
        extra: headerExtra || undefined
    });

    const columns = [
        {
            title: t('admin.brands.columns.name', 'Marka Adı'),
            dataIndex: 'name',
            key: 'name',
            sorter: (a: Brand, b: Brand) => a.name.localeCompare(b.name),
        },
        {
            title: t('admin.brands.columns.slug', 'Slug'),
            dataIndex: 'slug',
            key: 'slug',
        },
        {
            title: t('admin.common.actions', 'İşlemler'),
            key: 'actions',
            render: (_: any, record: Brand) => (
                <Space>
                    {canEdit && (
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => router.push(`/admin/brands/${record.id}/edit`)}
                        >
                            {t('admin.common.edit', 'Düzenle')}
                        </Button>
                    )}
                    {canDelete && (
                        <Popconfirm
                            title={t('admin.brands.delete_confirm_title', 'Markayı sil')}
                            description={t('admin.brands.delete_confirm_desc', 'Bu markayı silmek istediğinizden emin misiniz?')}
                            onConfirm={() => handleDelete(record.id)}
                            okText={t('admin.common.yes', 'Evet')}
                            cancelText={t('admin.common.no', 'Hayır')}
                        >
                            <Button type="link" danger icon={<DeleteOutlined />}>
                                {t('admin.common.delete', 'Sil')}
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <div style={{ marginBottom: 16, padding: "16px 24px 0" }}>
                <Input
                    placeholder={t('admin.common.search_placeholder', 'Tabloda arama yapın')}
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ maxWidth: 300 }}
                    size="large"
                />
            </div>

            <Table
                columns={columns}
                dataSource={filteredBrands}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showTotal: (total) => t('admin.brands.list.total', 'Toplam :count marka').replace(':count', total.toString()),
                }}
                className="ikas-style-table"
            />
        </>
    );
}
