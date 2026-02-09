"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { usePageHeader } from "@/hooks/usePageHeader";
import { t } from "@/lib/i18n";
import { apiFetch } from "@/lib/api";
import { CouponForm } from "@/components/admin/marketing/CouponForm";

import { useSearchParams } from "next/navigation";

export default function NewCouponPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") === "automatic" ? "automatic" : "manual";

    const { message } = App.useApp();
    const [saving, setSaving] = useState(false);

    usePageHeader({
        title: mode === 'manual' ? t("admin.marketing.coupons.new_coupon", "Yeni Kupon") : t("admin.marketing.coupons.new_auto", "Yeni Otomatik İndirim"),
        variant: "dark",
        onBack: () => router.push("/admin/marketing/coupons"),
    });

    const handleSave = async (values: any) => {
        setSaving(true);
        try {
            await apiFetch("/api/marketing/coupons", {
                method: "POST",
                json: values,
            });
            message.success(t("admin.marketing.coupons.create_success", "Kupon başarıyla oluşturuldu"));
            router.push("/admin/marketing/coupons");
        } catch (error: any) {
            message.error(error.message || t("admin.common.error", "Bir hata oluştu"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <CouponForm
            mode={mode}
            onSave={handleSave}
            saving={saving}
            onBack={() => router.push("/admin/marketing/coupons")}
        />
    );
}
