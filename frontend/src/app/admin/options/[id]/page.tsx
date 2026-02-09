"use client";

import { usePageHeader } from "@/hooks/usePageHeader";
import { OptionForm } from "@/components/admin/options/OptionForm";
import { App, Form, Skeleton } from "antd";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";

export default function EditOptionPage() {
    const { notification } = App.useApp();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [initialValues, setInitialValues] = useState<any>(null);

    useEffect(() => {
        if (id) {
            fetchOption(id);
        }
    }, [id]);

    const fetchOption = async (optionId: string) => {
        try {
            const data = await apiFetch<any>(`/api/options/${optionId}`);
            setInitialValues(data);
            form.setFieldsValue(data);
        } catch (e: any) {
            notification.error({
                message: t('admin.common.error', 'Hata'),
                description: t('admin.options.load_failed', 'Seçenek bilgileri alınamadı')
            });
            router.push("/admin/options");
        } finally {
            setLoading(false);
        }
    };

    const save = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            await apiFetch(`/api/options/${id}`, {
                method: "PUT",
                json: values
            });

            notification.success({ message: t('admin.options.update_success', 'Seçenek güncellendi') });
            router.push("/admin/options");
        } catch (e: any) {
            notification.error({
                message: t('admin.common.error', 'Hata'),
                description: e.message || t('admin.options.update_failed', 'Güncelleme başarısız')
            });
        } finally {
            setSaving(false);
        }
    };

    usePageHeader({
        title: initialValues ? `${t('admin.common.edit', 'Düzenle')}: ${initialValues.name}` : t('admin.options.edit_title', 'Seçenek Düzenle'),
        variant: "dark",
        breadcrumb: [
            { label: t('admin.options.title', 'Seçenekler'), href: "/admin/options" },
            { label: initialValues?.name || t('admin.common.edit', 'Düzenle') }
        ],
        onBack: () => router.push("/admin/options"),
        onSave: save,
        saving: saving
    });

    if (loading) {
        return <Skeleton active paragraph={{ rows: 10 }} />;
    }

    return (
        <Form form={form} layout="vertical" initialValues={initialValues}>
            <OptionForm form={form} initialValues={initialValues} />
        </Form>
    );
}
