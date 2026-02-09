"use client";

import React, { useEffect, useMemo, useState } from "react";
import { App, Form, Input, Space, Switch, Typography } from "antd";
import { useRouter } from "next/navigation";

import { usePageHeader } from "@/hooks/usePageHeader";
import { apiFetch } from "@/lib/api";
import { SectionCard } from "@/components/admin/SectionCard";
import { StorefrontSettingsProvider, useStorefrontSettings } from "@/context/StorefrontSettingsContext";

type SupportCardType = "whatsapp" | "phone" | "order_tracking";

type SupportCardConfig = {
  type: SupportCardType;
  title: string;
  subtitle: string;
  enabled: boolean;
};

function defaultCards(): SupportCardConfig[] {
  return [
    {
      type: "whatsapp",
      title: "WhatsApp Desteği",
      subtitle: "Size yardımcı olmaktan mutluluk duyarız",
      enabled: true,
    },
    {
      type: "phone",
      title: "Bizi Arayın",
      subtitle: "",
      enabled: true,
    },
    {
      type: "order_tracking",
      title: "Sipariş Takibi",
      subtitle: "Siparişinizin durumunu öğrenin",
      enabled: true,
    },
  ];
}

function isSupportCardType(v: unknown): v is SupportCardType {
  return v === "whatsapp" || v === "phone" || v === "order_tracking";
}

function parseCards(raw: unknown): SupportCardConfig[] | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const out: SupportCardConfig[] = parsed
      .map((x: any) => {
        const type = String(x?.type || "");
        if (!isSupportCardType(type)) return null;
        return {
          type,
          title: typeof x?.title === "string" ? x.title : "",
          subtitle: typeof x?.subtitle === "string" ? x.subtitle : "",
          enabled: x?.enabled === undefined ? true : !!x.enabled,
        } satisfies SupportCardConfig;
      })
      .filter(Boolean) as SupportCardConfig[];

    return out.length ? out : null;
  } catch {
    return null;
  }
}

function SupportCenterSettingsContent() {
  const { message } = App.useApp();
  const router = useRouter();
  const { settings, loading, refresh } = useStorefrontSettings();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const initialValues = useMemo(() => {
    const parsed = parseCards((settings as any)?.support_center_cards);
    const cards = parsed || defaultCards();

    const phoneSubtitleFallback = String(settings?.store_phone || settings?.whatsapp_phone || "").trim();
    return {
      cards: cards.map((c) => {
        if (c.type === "phone" && !c.subtitle) {
          return { ...c, subtitle: phoneSubtitleFallback };
        }
        return c;
      }),
    };
  }, [settings]);

  useEffect(() => {
    if (loading) return;
    form.setFieldsValue(initialValues);
  }, [loading, form, initialValues]);

  const handleSave = async (values: any) => {
    try {
      setSaving(true);

      const cards: SupportCardConfig[] = Array.isArray(values?.cards)
        ? values.cards
            .map((c: any) => ({
              type: String(c?.type || "") as SupportCardType,
              title: String(c?.title || "").trim(),
              subtitle: String(c?.subtitle || "").trim(),
              enabled: !!c?.enabled,
            }))
            .filter((c: SupportCardConfig) => isSupportCardType(c.type))
        : [];

      await apiFetch("/api/storefront/settings", {
        method: "POST",
        json: {
          support_center_cards: JSON.stringify(cards),
        },
      });

      await refresh();
      message.success("Kaydedildi");
      router.push("/admin/general-settings");
    } catch (error: any) {
      const errorMsg = error?.message || error?.details?.message || JSON.stringify(error);
      message.error(`Kaydedilemedi: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  usePageHeader({
    title: "Destek Merkezi",
    variant: "dark",
    onBack: () => router.push("/admin/general-settings"),
    onSave: () => form.submit(),
    saving,
  });

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto 80px", padding: "0 24px" }}>
      <Form form={form} layout="vertical" onFinish={handleSave} autoComplete="off" disabled={loading}>
        <SectionCard title="Kartlar">
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            Mobilde görünen Destek Merkezi kartlarının başlık ve alt başlıklarını buradan yönetebilirsiniz.
          </Typography.Text>

          <Form.List name="cards">
            {(fields) => (
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                {fields.map((field) => {
                  const type = form.getFieldValue(["cards", field.name, "type"]) as SupportCardType | undefined;

                  const typeLabel =
                    type === "whatsapp"
                      ? "WhatsApp"
                      : type === "phone"
                        ? "Telefon"
                        : type === "order_tracking"
                          ? "Sipariş Takibi"
                          : "Kart";

                  return (
                    <div
                      key={field.key}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 16,
                        background: "#fff",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <Typography.Text strong style={{ fontSize: 14 }}>
                          {typeLabel}
                        </Typography.Text>
                        <Form.Item name={[field.name, "enabled"]} valuePropName="checked" style={{ marginBottom: 0 }}>
                          <Switch checkedChildren="Açık" unCheckedChildren="Kapalı" />
                        </Form.Item>
                      </div>

                      <Form.Item name={[field.name, "type"]} hidden>
                        <Input />
                      </Form.Item>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 12 }}>
                        <Form.Item
                          name={[field.name, "title"]}
                          label="Başlık"
                          rules={[{ required: true, message: "Başlık zorunludur" }]}
                        >
                          <Input placeholder="Başlık" />
                        </Form.Item>

                        <Form.Item name={[field.name, "subtitle"]} label="Alt Başlık">
                          <Input placeholder="Alt başlık" />
                        </Form.Item>
                      </div>
                    </div>
                  );
                })}
              </Space>
            )}
          </Form.List>
        </SectionCard>
      </Form>
    </div>
  );
}

export default function SupportCenterSettingsPage() {
  return (
    <StorefrontSettingsProvider>
      <SupportCenterSettingsContent />
    </StorefrontSettingsProvider>
  );
}
