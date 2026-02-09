"use client";

import { usePageHeader } from "@/hooks/usePageHeader";
import { UnitForm } from "@/components/admin/UnitForm";
import { apiFetch } from "@/lib/api";
import { App } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewUnitPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    usePageHeader({
        title: "Yeni Birim Ekle",
        variant: "dark",
        breadcrumb: [
            { label: "Birimler", href: "/admin/units" },
            { label: "Yeni" },
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
            await apiFetch("/api/units", {
                method: "POST",
                json: values
            });
            message.success("Birim oluşturuldu");
            router.push("/admin/units");
        } catch (e: any) {
            message.error(e.message || "Hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ width: "100%", paddingBottom: 100 }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 48px 0 48px" }}>
                <UnitForm id="unit-form" onSave={handleSave} loading={saving} />
            </div>
        </div>
    );
}
