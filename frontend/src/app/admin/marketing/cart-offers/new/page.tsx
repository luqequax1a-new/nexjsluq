'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { usePageHeader } from '@/hooks/usePageHeader';
import { apiFetch } from '@/lib/api';
import { CartOfferForm } from '@/components/admin/marketing/cart-offers/CartOfferForm';

export default function NewCartOfferPage() {
    const router = useRouter();
    const { message } = App.useApp();
    const [saving, setSaving] = useState(false);

    usePageHeader({
        title: 'Yeni Sepet Teklifi',
        variant: 'dark',
        onBack: () => router.push('/admin/marketing/cart-offers'),
    });

    const handleSave = async (values: any) => {
        setSaving(true);
        try {
            await apiFetch('/api/marketing/cart-offers', {
                method: 'POST',
                json: values,
            });
            message.success('Sepet teklifi başarıyla oluşturuldu');
            router.push('/admin/marketing/cart-offers');
        } catch (error: any) {
            message.error(error.message || 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    return (
        <CartOfferForm
            onSave={handleSave}
            saving={saving}
            onBack={() => router.push('/admin/marketing/cart-offers')}
        />
    );
}
