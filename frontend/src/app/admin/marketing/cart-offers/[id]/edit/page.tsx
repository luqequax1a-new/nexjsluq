'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { App, Spin } from 'antd';
import { usePageHeader } from '@/hooks/usePageHeader';
import { apiFetch } from '@/lib/api';
import { CartOfferForm } from '@/components/admin/marketing/cart-offers/CartOfferForm';

export default function EditCartOfferPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const router = useRouter();
    const { message } = App.useApp();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [offer, setOffer] = useState<any>(null);

    usePageHeader({
        title: 'Sepet Teklifini Düzenle',
        variant: 'dark',
        onBack: () => router.push('/admin/marketing/cart-offers'),
    });

    useEffect(() => {
        if (!id) return;
        const fetchOffer = async () => {
            try {
                const data = await apiFetch(`/api/marketing/cart-offers/${id}`);
                setOffer(data);
            } catch (error: any) {
                message.error(error.message || 'Teklif yüklenirken hata oluştu');
                router.push('/admin/marketing/cart-offers');
            } finally {
                setLoading(false);
            }
        };

        fetchOffer();
    }, [id]);

    const handleSave = async (values: any) => {
        setSaving(true);
        try {
            await apiFetch(`/api/marketing/cart-offers/${id}`, {
                method: 'PUT',
                json: values,
            });
            message.success('Sepet teklifi başarıyla güncellendi');
            router.push('/admin/marketing/cart-offers');
        } catch (error: any) {
            message.error(error.message || 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <CartOfferForm
            initialValues={offer}
            onSave={handleSave}
            saving={saving}
            onBack={() => router.push('/admin/marketing/cart-offers')}
        />
    );
}
