"use client";

import { usePageHeader } from "@/hooks/usePageHeader";
import { VariationForm } from "@/components/admin/VariationForm";
import { apiFetch } from "@/lib/api";
import { App, Button } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewVariationPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    usePageHeader({
        title: "Yeni Varyant Ekle",
        variant: "dark",
        breadcrumb: [
            { label: "Varyantlar", href: "/admin/products/variations" },
            { label: "Yeni" },
        ],
        onBack: () => router.back(),
        onSave: () => {
            // We can't easily trigger submit from here without a ref, 
            // but we can use HTML form submit if we give the form an ID.
            const formElement = document.getElementById('variation-form') as HTMLFormElement;
            if (formElement) {
                // Dispatch a submit event to trigger antd form onFinish
                formElement.requestSubmit();
            }
        },
        saving: saving
    });

    const handleSave = async (values: any) => {
        try {
            setSaving(true);
            await apiFetch("/api/variations", {
                method: "POST",
                json: values
            });
            message.success("Varyant oluşturuldu");
            router.push("/admin/products/variations");
        } catch (e: any) {
            message.error(e.message || "Hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ width: "100%", paddingBottom: 100 }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 48px 0 48px" }}>
                <VariationForm id="variation-form" onSave={handleSave} loading={saving} />
            </div>
        </div>
    );
}
