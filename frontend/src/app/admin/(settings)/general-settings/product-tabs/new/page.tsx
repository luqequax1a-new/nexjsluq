"use client";

import React, { useCallback, useState } from "react";
import { App, Button, Form, Space } from "antd";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/usePageHeader";
import { createProductTab, ProductTabUpsert } from "@/lib/api/productTabs";
import { ProductTabForm } from "@/components/admin/settings/product-tabs/ProductTabForm";

function errorMessage(e: unknown): string | null {
  if (!e || typeof e !== "object") return null;
  const maybe = e as { message?: unknown };
  return typeof maybe.message === "string" ? maybe.message : null;
}

export default function ProductTabCreatePage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const save = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload: ProductTabUpsert = {
        title: String(values.title),
        content_html: (values.content_html ?? null) as string | null,
        position: Number(values.position ?? 0),
        is_active: Boolean(values.is_active ?? true),
        conditions: (values.conditions ?? null) ?? null,
      };

      const c = payload.conditions;
      if (
        c &&
        (!Array.isArray(c.product_ids) || c.product_ids.length === 0) &&
        (!Array.isArray(c.category_ids) || c.category_ids.length === 0) &&
        (!Array.isArray(c.tag_names) || c.tag_names.length === 0)
      ) {
        payload.conditions = null;
      }

      await createProductTab(payload);
      message.success("Sekme oluşturuldu.");
      router.push("/admin/general-settings/product-tabs");
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      message.error(errorMessage(e) || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }, [form, message, router]);

  usePageHeader({
    title: "Yeni Ürün Sekmesi",
    breadcrumb: [
      { label: "Ayarlar", href: "/admin/general-settings" },
      { label: "Ürün Sekmeleri", href: "/admin/general-settings/product-tabs" },
      { label: "Yeni" },
    ],
    onBack: () => router.push("/admin/general-settings/product-tabs"),
    extra: (
      <Space>
        <Button onClick={() => router.push("/admin/general-settings/product-tabs")} style={{ height: 40 }}>
          Vazgeç
        </Button>
        <Button
          type="primary"
          onClick={save}
          loading={saving}
          style={{ height: 40, background: "#5E5CE6", borderRadius: 10, fontWeight: 700 }}
        >
          Kaydet
        </Button>
      </Space>
    ),
  });

  return (
    <div style={{ padding: "0 24px 40px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          title: "",
          is_active: true,
          position: 0,
          content_html: "",
          conditions: {
            match: "any",
            category_mode: "any",
            tag_mode: "any",
            product_ids: [],
            category_ids: [],
            tag_names: [],
          },
        }}
      >
        <ProductTabForm form={form} initial={null} disabled={saving} />
      </Form>
    </div>
  );
}
