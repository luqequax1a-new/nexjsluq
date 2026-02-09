"use client";

import { usePageHeader } from "@/hooks/usePageHeader";
import { AttributeSetForm } from "@/components/admin/attributes/AttributeSetForm";
import { App, Form, Skeleton } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function EditAttributeSetPage() {
    const { notification } = App.useApp();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [initialValues, setInitialValues] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiFetch<any>(`/api/attribute-sets/${id}`);
                setInitialValues(res);
                form.setFieldsValue(res);
            } catch (e: any) {
                notification.error({ message: "Hata", description: "Yüklenemedi" });
                router.push("/admin/attribute-sets");
            } finally {
                setLoading(false);
            }
        };
        if (id) void load();
    }, [id]);

    const save = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            await apiFetch(`/api/attribute-sets/${id}`, { method: "PUT", json: values });
            notification.success({ message: "Güncellendi" });
            router.push("/admin/attribute-sets");
        } catch (e: any) {
            notification.error({ message: "Hata", description: e?.message || "Güncellenemedi" });
        } finally {
            setSaving(false);
        }
    };

    usePageHeader({
        title: initialValues ? `Düzenle: ${initialValues.name}` : "Özellik Seti Düzenle",
        variant: "dark",
        breadcrumb: [
            { label: "Özellik Setleri", href: "/admin/attribute-sets" },
            { label: initialValues?.name || "Düzenle" },
        ],
        onBack: () => router.push("/admin/attribute-sets"),
        onSave: save,
        saving,
    });

    if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

    return (
        <Form form={form} layout="vertical" initialValues={initialValues}>
            <AttributeSetForm form={form} />
        </Form>
    );
}
