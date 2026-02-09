"use client";

import { usePageHeader } from "@/hooks/usePageHeader";
import { VariationForm } from "@/components/admin/VariationForm";
import { apiFetch } from "@/lib/api";
import { Variation } from "@/types/product";
import { App } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageLoader } from "@/components/admin/PageLoader";

export default function EditVariationPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const params = useParams();
    const [variation, setVariation] = useState<Variation | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchVariation(params.id as string);
        }
    }, [params.id]);

    const fetchVariation = async (id: string) => {
        try {
            setLoading(true);
            const data = await apiFetch<Variation>(`/api/variations/${id}`);
            setVariation(data);
        } catch (e: any) {
            message.error("Varyant yüklenemedi");
            router.push("/admin/products/variations");
        } finally {
            setLoading(false);
        }
    };

    usePageHeader({
        title: "Varyant Düzenle",
        variant: "dark",
        breadcrumb: [
            { label: "Varyantlar", href: "/admin/products/variations" },
            { label: variation?.name || "Düzenle" },
        ],
        onBack: () => router.back(),
        onSave: () => {
            const formElement = document.getElementById('variation-form') as HTMLFormElement;
            if (formElement) {
                formElement.requestSubmit();
            }
        },
        saving: saving
    });

    const handleSave = async (values: any) => {
        try {
            setSaving(true);
            await apiFetch(`/api/variations/${params.id}`, {
                method: "PUT",
                json: values
            });
            message.success("Varyant güncellendi");
            router.push("/admin/products/variations");
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
                <VariationForm
                    id="variation-form"
                    initialValues={variation || undefined}
                    onSave={handleSave}
                    loading={saving}
                />
            </div>
        </div>
    );
}
