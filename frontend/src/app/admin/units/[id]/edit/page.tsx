"use client";

import { usePageHeader } from "@/hooks/usePageHeader";
import { UnitForm } from "@/components/admin/UnitForm";
import { apiFetch } from "@/lib/api";
import { App } from "antd";
import { PageLoader } from "@/components/admin/PageLoader";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditUnitPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const params = useParams();
    const [unit, setUnit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchUnit(params.id as string);
        }
    }, [params.id]);

    const fetchUnit = async (id: string) => {
        try {
            setLoading(true);
            const data = await apiFetch<any>(`/api/units/${id}`);
            setUnit(data);
        } catch (e: any) {
            message.error("Birim yüklenemedi");
            router.push("/admin/units");
        } finally {
            setLoading(false);
        }
    };

    usePageHeader({
        title: "Birim Düzenle",
        variant: "dark",
        breadcrumb: [
            { label: "Birimler", href: "/admin/units" },
            { label: unit?.name || "Düzenle" },
        ],
        onBack: () => router.back(),
        onSave: () => {
            const formElement = document.getElementById('unit-form') as HTMLFormElement;
            if (formElement) {
                formElement.requestSubmit();
            }
        },
        saving: saving
    });

    const handleSave = async (values: any) => {
        try {
            setSaving(true);
            await apiFetch(`/api/units/${params.id}`, {
                method: "PUT",
                json: values
            });
            message.success("Birim güncellendi");
            router.push("/admin/units");
        } catch (e: any) {
            message.error(e.message || "Hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div style={{ width: "100%", paddingBottom: 100 }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 48px 0 48px" }}>
                <UnitForm
                    id="unit-form"
                    initialValues={unit || undefined}
                    onSave={handleSave}
                    loading={saving}
                />
            </div>
        </div>
    );
}
