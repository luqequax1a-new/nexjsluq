"use client";

import { usePageHeader } from "@/hooks/usePageHeader";
import { OptionForm } from "@/components/admin/options/OptionForm";
import { App, Form } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";

export default function NewOptionPage() {
    const { notification } = App.useApp();
    const router = useRouter();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    const save = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            await apiFetch("/api/options", {
                method: "POST",
                json: values
            });

            notification.success({ message: t('admin.options.save_success', 'Seçenek oluşturuldu') });
            router.push("/admin/options");
        } catch (e: any) {
            notification.error({
                message: t('admin.common.error', 'Hata'),
                description: e.message || t('admin.options.save_failed', 'Kayıt başarısız')
            });
        } finally {
            setSaving(false);
        }
    };

    usePageHeader({
        title: t('admin.options.add_title', 'Yeni Seçenek Ekle'),
        variant: "dark",
        breadcrumb: [
            { label: t('admin.options.title', 'Seçenekler'), href: "/admin/options" },
            { label: t('admin.common.new', 'Yeni Ekle') }
        ],
        onBack: () => router.push("/admin/options"),
        onSave: save,
        saving: saving
    });

    return (
        <Form form={form} layout="vertical">
            <OptionForm form={form} />
        </Form>
    );
}
