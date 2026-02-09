'use client';

import { Modal } from 'antd';
import { useRouter } from 'next/navigation';

interface CategoryTypeModalProps {
    open: boolean;
    onClose: () => void;
}

export function CategoryTypeModal({ open, onClose }: CategoryTypeModalProps) {
    const router = useRouter();

    const handleSelectType = (type: 'normal' | 'dynamic') => {
        onClose();
        router.push(`/admin/categories/new?type=${type}`);
    };

    return (
        <Modal
            title="Kategori Ekle"
            open={open}
            onCancel={onClose}
            footer={null}
            width={600}
            centered
        >
            <div style={{ padding: '20px 0' }}>
                <div
                    onClick={() => handleSelectType('normal')}
                    style={{
                        padding: '20px 24px',
                        border: '1px solid #e8e8e8',
                        borderRadius: 8,
                        marginBottom: 16,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 16,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#5E5CE6';
                        e.currentTarget.style.backgroundColor = '#f5f5ff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e8e8e8';
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                    }}>
                        📁
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: '#262626' }}>
                            Normal Kategori
                        </div>
                        <div style={{ fontSize: 14, color: '#8c8c8c' }}>
                            Ürünlerinize oluşturacağınız kategoriyi tek tek ekleyin.
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleSelectType('dynamic')}
                    style={{
                        padding: '20px 24px',
                        border: '1px solid #e8e8e8',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 16,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#5E5CE6';
                        e.currentTarget.style.backgroundColor = '#f5f5ff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e8e8e8';
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                    }}>
                        ⚡
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: '#262626' }}>
                            Dinamik Kategori
                        </div>
                        <div style={{ fontSize: 14, color: '#8c8c8c' }}>
                            Belirleyeceğiniz koşullara uyan ürünler yeni kategoriye otomatik eklensin.
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
