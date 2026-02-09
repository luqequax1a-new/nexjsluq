"use client";

import { usePageHeader } from "@/hooks/usePageHeader";
import { AttributeSetForm } from "@/components/admin/attributes/AttributeSetForm";
import { App, Form } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function NewAttributeSetPage() {
    const { notification } = App.useApp();
    const router = useRouter();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    const save = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            await apiFetch("/api/attribute-sets", { method: "POST", json: values });
            notification.success({ message: "Kaydedildi" });
            router.push("/admin/attribute-sets");
        } catch (e: any) {
            notification.error({ message: "Hata", description: e?.message || "Kaydedilemedi" });
        } finally {
            setSaving(false);
        }
    };

    usePageHeader({
        title: "Yeni Özellik Seti",
        variant: "dark",
        breadcrumb: [
            { label: "Özellik Setleri", href: "/admin/attribute-sets" },
            { label: "Yeni" },
        ],
        onBack: () => router.push("/admin/attribute-sets"),
        onSave: save,
        saving,
    });

    return (
        <Form form={form} layout="vertical">
            <AttributeSetForm form={form} />
        </Form>
    );
}
