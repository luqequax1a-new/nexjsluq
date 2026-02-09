"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import { App, Button, Form, Popconfirm, Space, Spin } from "antd";
import { DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/usePageHeader";
import { deleteProductTab, getProductTab, ProductTab, ProductTabUpsert, updateProductTab } from "@/lib/api/productTabs";
import { ProductTabForm } from "@/components/admin/settings/product-tabs/ProductTabForm";

function errorMessage(e: unknown): string | null {
  if (!e || typeof e !== "object") return null;
  const maybe = e as { message?: unknown };
  return typeof maybe.message === "string" ? maybe.message : null;
}

export default function ProductTabEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  const resolvedParams = use(params);
  const tabId = Number(resolvedParams.id);
  const [tab, setTab] = useState<ProductTab | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (!Number.isFinite(tabId) || tabId <= 0) throw new Error("Geçersiz sekme id.");
      const res = await getProductTab(tabId);
      setTab(res.tab);
    } catch (e: unknown) {
      message.error(errorMessage(e) || "Sekme yüklenemedi.");
      router.push("/admin/general-settings/product-tabs");
    } finally {
      setLoading(false);
    }
  }, [message, router, tabId]);

  useEffect(() => {
    void load();
  }, [load]);

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

      await updateProductTab(tabId, payload);
      message.success("Sekme güncellendi.");
      await load();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      message.error(errorMessage(e) || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }, [form, load, message, tabId]);

  usePageHeader({
    title: tab?.title ? `Sekme: ${tab.title}` : "Sekme Düzenle",
    breadcrumb: [
      { label: "Ayarlar", href: "/admin/general-settings" },
      { label: "Ürün Sekmeleri", href: "/admin/general-settings/product-tabs" },
      { label: "Düzenle" },
    ],
    onBack: () => router.push("/admin/general-settings/product-tabs"),
    extra: (
      <Space>
        <Popconfirm
          title="Sekme silinsin mi?"
          okText="Sil"
          cancelText="Vazgeç"
          onConfirm={async () => {
            try {
              await deleteProductTab(tabId);
              message.success("Sekme silindi.");
              router.push("/admin/general-settings/product-tabs");
            } catch (e: unknown) {
              message.error(errorMessage(e) || "Silinemedi.");
            }
          }}
        >
          <Button danger icon={<DeleteOutlined />} style={{ height: 40 }}>
            Sil
          </Button>
        </Popconfirm>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={save}
          loading={saving}
          style={{ height: 40, background: "#5E5CE6", borderRadius: 10, fontWeight: 700 }}
        >
          Kaydet
        </Button>
      </Space>
    ),
  });

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 24px" }}>
        <Spin size="large" />
      </div>
    );
  }

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
        <ProductTabForm form={form} initial={tab} disabled={saving} />
      </Form>
    </div>
  );
}

