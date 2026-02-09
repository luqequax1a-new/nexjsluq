'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Space, Popconfirm, Input, Tabs, Tag, Switch } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined, PlusOutlined, FilterOutlined, ExportOutlined, ImportOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getCategoryTree, deleteCategory } from '@/lib/api/categories';
import { CategoryTreeNode } from '@/types/category';
import { usePageHeader } from '@/hooks/usePageHeader';
import { CategoryTypeModal } from '@/components/admin/category/CategoryTypeModal';
import { t } from '@/lib/i18n';
import { useAuth, hasPermission } from '@/lib/auth';
import './categories.css';

export default function CategoriesPage() {
    const router = useRouter();
    const { me } = useAuth();
    const [activeTab, setActiveTab] = useState<'normal' | 'dynamic'>('normal');
    const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [typeModalOpen, setTypeModalOpen] = useState(false);
    const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set());

    const fetchCategories = async (type: 'normal' | 'dynamic') => {
        try {
            setLoading(true);
            const response = await getCategoryTree(type);
            setCategories(response.categories || []);

            // Tüm kategorileri başlangıçta açık yap
            const allIds = new Set<number>();
            const collectIds = (cats: CategoryTreeNode[]) => {
                cats.forEach(cat => {
                    if (cat.children && cat.children.length > 0) {
                        allIds.add(cat.id);
                        collectIds(cat.children);
                    }
                });
            };
            collectIds(response.categories || []);
            setExpandedKeys(allIds);
        } catch (error) {
            console.error('Kategoriler yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories(activeTab);
    }, [activeTab]);

    const handleDelete = async (id: number) => {
        try {
            await deleteCategory(id);
            fetchCategories(activeTab);
        } catch (error) {
            console.error('Kategori silinemedi:', error);
        }
    };

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedKeys);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedKeys(newExpanded);
    };

    const flattenCategories = (cats: CategoryTreeNode[], depth = 0, parentExpanded = true): any[] => {
        let result: any[] = [];
        cats.forEach(cat => {
            const { children, ...catWithoutChildren } = cat;
            const hasChildren = children && children.length > 0;
            const isExpanded = expandedKeys.has(cat.id);

            if (parentExpanded) {
                result.push({
                    ...catWithoutChildren,
                    depth,
                    hasChildren,
                    isExpanded
                });
            }

            if (hasChildren && isExpanded && parentExpanded) {
                result = result.concat(flattenCategories(children, depth + 1, true));
            }
        });
        return result;
    };

    const flatCategories = flattenCategories(categories);
    const filteredCategories = flatCategories.filter(cat =>
        cat.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const headerExtra = useMemo(() => (
        <Space size={12}>
            <Button icon={<ExportOutlined />} style={{ fontWeight: 600, height: 40, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                {t('admin.common.export', 'Dışa Aktar')}
            </Button>
            <Button icon={<ImportOutlined />} style={{ fontWeight: 600, height: 40, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                {t('admin.common.import', 'İçe Aktar')}
            </Button>
            {hasPermission(me, 'categories.create') && (
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setTypeModalOpen(true)}
                    style={{ background: "#5E5CE6", borderColor: "#5E5CE6", fontWeight: 700, height: 40, borderRadius: 8 }}
                >
                    {t('admin.categories.add_button', 'Kategori Ekle')}
                </Button>
            )}
        </Space>
    ), [me]);

    usePageHeader({
        title: t('admin.categories.title', 'Kategoriler'),
        variant: "light",
        extra: headerExtra
    });

    const columns = [
        {
            title: t('admin.categories.columns.name', 'Ad'),
            dataIndex: 'name',
            key: 'name',
            width: '40%',
            render: (name: string, record: any) => {
                return (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: record.depth * 24,
                        gap: 8
                    }}>
                        {record.hasChildren ? (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(record.id);
                                }}
                                style={{
                                    color: '#595959',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    display: 'inline-block',
                                    width: 12,
                                    transition: 'transform 0.2s'
                                }}
                            >
                                {record.isExpanded ? '▼' : '>'}
                            </span>
                        ) : record.depth > 0 ? (
                            <span style={{
                                color: '#d9d9d9',
                                fontSize: 14,
                                width: 12,
                                display: 'inline-block'
                            }}>└</span>
                        ) : (
                            <span style={{ width: 12, display: 'inline-block' }}></span>
                        )}
                        <span style={{
                            fontWeight: record.depth === 0 ? 600 : 400,
                            color: '#262626'
                        }}>
                            {name}
                        </span>
                    </div>
                );
            },
        },
        {
            title: t('admin.categories.columns.type', 'Tür'),
            dataIndex: 'type',
            key: 'type',
            width: '20%',
            render: (type: string) => (
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    background: type === 'normal' ? '#f0f0f0' : '#f9f0ff',
                    border: type === 'normal' ? '1px solid #d9d9d9' : '1px solid #d3adf7',
                    borderRadius: 4,
                    fontSize: 13,
                    color: type === 'normal' ? '#595959' : '#722ed1'
                }}>
                    <span style={{ fontSize: 10 }}>●</span>
                    {type === 'normal' ? t('admin.categories.types.normal', 'Normal Kategori') : t('admin.categories.types.dynamic', 'Dinamik Kategori')}
                </span>
            ),
        },
        {
            title: t('admin.categories.columns.sorting', 'Sıralama Ölçütü'),
            key: 'sorting',
            width: '25%',
            render: () => (
                <span style={{ color: '#bfbfbf', fontSize: 14 }}>—</span>
            ),
        },
        {
            title: '',
            key: 'actions',
            width: '15%',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Space size="small">
                    {hasPermission(me, 'categories.edit') && (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => router.push(`/admin/categories/${record.id}/edit`)}
                            style={{ color: '#1890ff' }}
                        >
                            {t('admin.common.edit', 'Düzenle')}
                        </Button>
                    )}
                    {hasPermission(me, 'categories.destroy') && (
                        <Popconfirm
                            title={t('admin.categories.delete_confirm_title', 'Kategoriyi sil')}
                            description={t('admin.categories.delete_confirm_desc', 'Bu kategoriyi silmek istediğinizden emin misiniz?')}
                            onConfirm={() => handleDelete(record.id)}
                            okText={t('admin.common.yes', 'Evet')}
                            cancelText={t('admin.common.no', 'Hayır')}
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                style={{ color: '#ff4d4f' }}
                            >
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
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0" }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as 'normal' | 'dynamic')}
                    items={[
                        { key: 'normal', label: t('admin.categories.types.normal', 'Normal Kategori') },
                        { key: 'dynamic', label: t('admin.categories.types.dynamic', 'Dinamik Kategori') },
                    ]}
                />
            </div>

            <div style={{ padding: "16px 24px 0", marginBottom: 16, display: 'flex', gap: 12 }}>
                <Input
                    placeholder={t('admin.common.search_placeholder', 'Tabloda arama yapın')}
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ maxWidth: 300 }}
                    size="large"
                />
                <Button
                    icon={<FilterOutlined />}
                    size="large"
                    style={{ border: '1px solid #d9d9d9' }}
                >
                    {t('admin.common.filter', 'Filtre')}
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={filteredCategories}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 50,
                    showSizeChanger: true,
                    showTotal: (total) => t('admin.categories.list.total', 'Toplam :count kategori').replace(':count', total.toString()),
                    style: { marginTop: 16 }
                }}
                className="ikas-style-table"
            />

            <CategoryTypeModal
                open={typeModalOpen}
                onClose={() => setTypeModalOpen(false)}
            />
        </>
    );
}
