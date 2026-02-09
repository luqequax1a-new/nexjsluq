'use client';

import { useEffect } from 'react';
import { Form, Button, Modal, Input, Tree, Dropdown, Tag, Space } from 'antd';
import { PlusOutlined, SearchOutlined, MoreOutlined, EditOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useCategorySelection } from '@/hooks/useCategorySelection';

export function CategorySection() {
    const form = Form.useFormInstance();
    const router = useRouter();
    const {
        modalOpen,
        openModal,
        closeModal,
        handleSave,
        categories,
        loading,
        searchText,
        setSearchText,
        selectedKeys,
        setSelectedKeys,
        selectedExplicitKeys,
        setSelectedExplicitKeys,
        tempSelectedExplicitKeys,
        setTempSelectedExplicitKeys,
        primaryCategoryId,
        setPrimaryCategoryId,
        buildTreeData,
        getDerivedSelection,
        getCategoryPath,
        removeCategory,
        setPrimary,
        normalizePrimaryToLeaf,
    } = useCategorySelection();

    const formCategories = Form.useWatch('categories', form);
    const formPrimary = Form.useWatch('primary_category_id', form);

    // Sync FROM form whenever form values change (e.g. after backend fetch)
    useEffect(() => {
        if (formCategories !== undefined) {
            // Avoid unnecessary state updates that trigger infinite loops
            const current = selectedKeys || [];
            const next = formCategories || [];

            const areEqual = current.length === next.length &&
                [...current].sort((a, b) => a - b).every((v, i) => v === [...next].sort((a, b) => a - b)[i]);

            if (!areEqual) {
                setSelectedKeys(next);
            }
        }
    }, [formCategories]);

    useEffect(() => {
        if (formPrimary !== undefined) {
            setPrimaryCategoryId(formPrimary);
        }
    }, [formPrimary]);

    // Update form ONLY when local selection changes via user interaction
    // We use a small comparison to avoid loops
    const syncToForm = (newKeys: number[], newPrimary: number | null) => {
        form.setFieldsValue({
            categories: newKeys,
            primary_category_id: newPrimary
        });
    };

    const handleModalSave = () => {
        handleSave();
        const { effective } = getDerivedSelection(tempSelectedExplicitKeys);
        syncToForm(effective, normalizePrimaryToLeaf(primaryCategoryId, tempSelectedExplicitKeys));
    };

    const filterTreeData = (data: any[], search: string): any[] => {
        if (!search) return data;
        return data.reduce((acc: any[], node: any) => {
            const matches = node.title.toLowerCase().includes(search.toLowerCase());
            const filteredChildren = node.children ? filterTreeData(node.children, search) : [];

            if (matches || filteredChildren.length > 0) {
                acc.push({
                    ...node,
                    children: filteredChildren,
                });
            }
            return acc;
        }, []);
    };

    const treeData = buildTreeData(categories);
    const filteredTreeData = filterTreeData(treeData, searchText);
    const tempDerived = getDerivedSelection(tempSelectedExplicitKeys);

    return (
        <>
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 }}>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={openModal}
                        style={{ padding: 0, height: 'auto', fontSize: 13, color: '#6366F1' }}
                    >
                        Kategorileri Düzenle
                    </Button>
                </div>

                {selectedExplicitKeys.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 24px'
                    }}>
                        <div style={{ marginBottom: 8, color: '#000', fontSize: 14, fontWeight: 500 }}>
                            Henüz bir kategori eklemediniz.
                        </div>
                        <div style={{ marginBottom: 24, color: '#666', fontSize: 13 }}>
                            Ürünlerinize ait kategorileri girin.
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={openModal}
                            style={{
                                background: '#6366F1',
                                borderColor: '#6366F1',
                                height: 36,
                                fontSize: 13,
                                fontWeight: 500,
                                borderRadius: 6,
                                paddingLeft: 16,
                                paddingRight: 16
                            }}
                        >
                            Kategori Ekle
                        </Button>
                    </div>
                ) : (
                    <div>
                        {selectedExplicitKeys
                            .sort((a, b) => {
                                // Primary category always first
                                if (a === primaryCategoryId) return -1;
                                if (b === primaryCategoryId) return 1;
                                return 0;
                            })
                            .map((catId, index) => {
                                const path = getCategoryPath(catId);
                                const isPrimary = primaryCategoryId === catId;

                                return (
                                    <div
                                        key={catId}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 0',
                                            borderBottom: index < selectedExplicitKeys.length - 1 ? '1px solid #f0f0f0' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                                            {path.map((p, i) => (
                                                <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    {i > 0 && <span style={{ color: '#999', fontSize: 14, fontWeight: 300 }}>›</span>}
                                                    <span style={{
                                                        fontSize: 14,
                                                        color: '#000',
                                                        fontWeight: 400
                                                    }}>
                                                        {p.name}
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                        <Dropdown
                                            menu={{
                                                items: [
                                                    ...(!isPrimary ? [{
                                                        key: 'primary',
                                                        label: 'Ana Kategori Yap',
                                                        onClick: () => {
                                                            const { effective } = getDerivedSelection(selectedExplicitKeys);
                                                            const newPrimary = normalizePrimaryToLeaf(catId, selectedExplicitKeys);
                                                            setPrimary(catId);
                                                            syncToForm(effective, newPrimary);
                                                        }
                                                    }] : []),
                                                    {
                                                        key: 'remove',
                                                        label: 'Kaldır',
                                                        danger: true,
                                                        onClick: () => {
                                                            const newExplicit = selectedExplicitKeys.filter(k => k !== catId);
                                                            const { effective } = getDerivedSelection(newExplicit);
                                                            const newPrimary = normalizePrimaryToLeaf(primaryCategoryId, newExplicit);
                                                            removeCategory(catId);
                                                            syncToForm(effective, newPrimary);
                                                        }
                                                    }
                                                ]
                                            }}
                                            trigger={['click']}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {isPrimary && (
                                                    <Tag
                                                        style={{
                                                            margin: 0,
                                                            background: '#E0E7FF',
                                                            border: 'none',
                                                            color: '#4F46E5',
                                                            fontSize: 12,
                                                            padding: '1px 8px',
                                                            borderRadius: 4,
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        Ana Kategori
                                                    </Tag>
                                                )}
                                                <Button type="text" icon={<MoreOutlined />} size="small" />
                                            </div>
                                        </Dropdown>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            <Form.Item name="categories" hidden>
                <Input type="hidden" />
            </Form.Item>
            <Form.Item name="primary_category_id" hidden>
                <Input type="hidden" />
            </Form.Item>

            <Modal
                title="Kategori Ekle"
                open={modalOpen}
                onCancel={closeModal}
                onOk={handleModalSave}
                width={600}
                okText="Kaydet"
                cancelText="Vazgeç"
                okButtonProps={{ style: { background: '#6366F1', borderColor: '#6366F1' } }}
                footer={(
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                        <div style={{ fontSize: 14, color: '#000', fontWeight: 500 }}>
                            {tempSelectedExplicitKeys.length} Seçili
                        </div>
                        <Space>
                            <Button onClick={closeModal} style={{ borderRadius: 6 }}>Vazgeç</Button>
                            <Button
                                type="primary"
                                onClick={handleModalSave}
                                style={{
                                    background: '#6366F1',
                                    borderColor: '#6366F1',
                                    borderRadius: 6
                                }}
                            >
                                Kaydet
                            </Button>
                        </Space>
                    </div>
                )}
            >
                <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                    <Input
                        placeholder="Ara"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        suffix={
                            searchText ? (
                                <div
                                    onClick={() => setSearchText('')}
                                    style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        background: '#ff4d4f',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        color: '#fff',
                                        fontWeight: 600
                                    }}
                                >
                                    ×
                                </div>
                            ) : null
                        }
                        style={{ flex: 1 }}
                    />
                    <Button onClick={() => router.push('/admin/categories/new')}>
                        Yeni Ekle
                    </Button>
                </div>

                {categories.length === 0 && !loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                            Kategori bulunamadı
                        </div>
                        <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 16 }}>
                            Yeni Ekle butonuna basarak yeni Kategori oluşturabilirsiniz
                        </div>
                    </div>
                ) : (
                    <div style={{
                        maxHeight: 400,
                        overflowY: 'auto',
                        border: '1px solid #f0f0f0',
                        borderRadius: 6,
                        padding: 12
                    }}>
                        <Tree
                            checkable
                            checkStrictly
                            checkedKeys={{
                                checked: tempDerived.checked,
                                halfChecked: tempDerived.halfChecked,
                            }}
                            onCheck={(checked: any) => {
                                const keys = Array.isArray(checked) ? checked : checked.checked;
                                setTempSelectedExplicitKeys(keys.map((k: any) => Number(k)));
                            }}
                            treeData={filteredTreeData}
                            defaultExpandAll
                            switcherIcon={<span style={{ fontSize: 16, fontWeight: 600 }}>›</span>}
                            style={{
                                fontSize: 14
                            }}
                            className="custom-category-tree"
                        />
                        <style jsx global>{`
                            .custom-category-tree .ant-tree-treenode {
                                padding: 4px 0;
                            }
                            .custom-category-tree .ant-tree-node-content-wrapper {
                                background: transparent !important;
                            }
                            .custom-category-tree .ant-tree-node-content-wrapper:hover {
                                background: #f5f5f5 !important;
                            }
                            .custom-category-tree .ant-tree-node-selected .ant-tree-node-content-wrapper {
                                background: transparent !important;
                            }
                            .custom-category-tree .ant-tree-switcher {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }
                            .custom-category-tree .ant-tree-switcher-icon {
                                font-size: 18px !important;
                                font-weight: 600 !important;
                                color: #666 !important;
                            }
                            .custom-category-tree .ant-tree-checkbox-inner {
                                border-radius: 4px !important;
                                border: 2px solid #d9d9d9 !important;
                                width: 18px !important;
                                height: 18px !important;
                            }
                            .custom-category-tree .ant-tree-checkbox-checked .ant-tree-checkbox-inner {
                                background-color: #6366F1 !important;
                                border-color: #6366F1 !important;
                            }
                            .custom-category-tree .ant-tree-checkbox-checked .ant-tree-checkbox-inner::after {
                                border-color: #fff !important;
                                border-width: 2px !important;
                            }
                        `}</style>
                    </div>
                )}
            </Modal>
        </>
    );
}
