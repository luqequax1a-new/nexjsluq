"use client";

import React, { useEffect, useMemo, useState } from "react";
import { App, Form, Input, Spin, Typography } from "antd";
import { usePageHeader } from "@/hooks/usePageHeader";
import { useStorefrontSettings, StorefrontSettingsProvider } from "@/context/StorefrontSettingsContext";
import { apiFetch } from "@/lib/api";
import {
  DEFAULT_WHATSAPP_CART_TEMPLATE,
  DEFAULT_WHATSAPP_PRODUCT_TEMPLATE,
} from "@/lib/whatsapp";
import { SectionCard } from "@/components/admin/SectionCard";
import { useRouter } from "next/navigation";
import { CheckOutlined, StopOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { TextArea } = Input;

function WhatsAppSettingsContent() {
  const { message } = App.useApp();
  const router = useRouter();
  const { settings, loading, refresh } = useStorefrontSettings();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const productEnabled = Form.useWatch('whatsapp_product_enabled', form);
  const cartEnabled = Form.useWatch('whatsapp_cart_enabled', form);

  const toggleSetting = async (key: string, next: boolean) => {
    try {
      await apiFetch("/api/storefront/settings", {
        method: "POST",
        json: { [key]: String(!!next) },
      });
      await refresh();
      form.setFieldValue(key, !!next);
      message.success(next ? "Aktif" : "Pasif");
    } catch (error: any) {
      const errorMsg = error?.message || error?.details?.message || JSON.stringify(error);
      message.error(`İşlem başarısız: ${errorMsg}`);
    }
  };

  const actions = useMemo(() => {
    return [
      productEnabled
        ? {
            key: "product-off",
            icon: <StopOutlined />,
            label: "Ürün Butonu: Pasif Yap",
            onClick: () => void toggleSetting("whatsapp_product_enabled", false),
          }
        : {
            key: "product-on",
            icon: <CheckOutlined />,
            label: "Ürün Butonu: Aktif Yap",
            onClick: () => void toggleSetting("whatsapp_product_enabled", true),
          },
      cartEnabled
        ? {
            key: "cart-off",
            icon: <StopOutlined />,
            label: "Sepet/Checkout: Pasif Yap",
            onClick: () => void toggleSetting("whatsapp_cart_enabled", false),
          }
        : {
            key: "cart-on",
            icon: <CheckOutlined />,
            label: "Sepet/Checkout: Aktif Yap",
            onClick: () => void toggleSetting("whatsapp_cart_enabled", true),
          },
    ];
  }, [productEnabled, cartEnabled]);

  usePageHeader({
    title: "WhatsApp Modülü",
    variant: "dark",
    onBack: () => router.push("/admin/general-settings"),
    onSave: () => form.submit(),
    saving,
    actions,
  });

  useEffect(() => {
    if (loading) return;
    form.setFieldsValue({
      whatsapp_phone: settings.whatsapp_phone || settings.store_phone || "",
      whatsapp_product_enabled: settings.whatsapp_product_enabled === "true",
      whatsapp_product_button_text: settings.whatsapp_product_button_text || "WhatsApp'tan Sor",
      whatsapp_product_message_template:
        settings.whatsapp_product_message_template || DEFAULT_WHATSAPP_PRODUCT_TEMPLATE,
      whatsapp_cart_enabled: settings.whatsapp_cart_enabled === "true",
      whatsapp_cart_button_text: settings.whatsapp_cart_button_text || "Sepeti WhatsApp’tan Gönder",
      whatsapp_cart_message_template:
        settings.whatsapp_cart_message_template || DEFAULT_WHATSAPP_CART_TEMPLATE,
    });
  }, [settings, loading, form]);

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      const payload = {
        whatsapp_phone: String(values.whatsapp_phone || "").trim(),
        whatsapp_product_enabled: String(!!values.whatsapp_product_enabled),
        whatsapp_product_button_text: String(values.whatsapp_product_button_text || "").trim(),
        whatsapp_product_message_template: String(values.whatsapp_product_message_template || ""),
        whatsapp_cart_enabled: String(!!values.whatsapp_cart_enabled),
        whatsapp_cart_button_text: String(values.whatsapp_cart_button_text || "").trim(),
        whatsapp_cart_message_template: String(values.whatsapp_cart_message_template || ""),
      };

      await apiFetch("/api/storefront/settings", {
        method: "POST",
        json: payload,
      });

      await refresh();
      message.success("WhatsApp ayarları kaydedildi.");
    } catch (error: any) {
      console.error("WhatsApp settings save error:", error);
      const errorMsg = error?.message || error?.details?.message || JSON.stringify(error);
      message.error(`Ayarlar kaydedilemedi: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto 80px", padding: "0 24px" }}>
      <Form form={form} layout="vertical" onFinish={handleSave} autoComplete="off">
        <SectionCard title="Genel">
          <Form.Item
            name="whatsapp_phone"
            label="WhatsApp Telefon Numarası"
            tooltip="Ülke kodu ile, boşluk ve + olmadan (örn: 9053XXXXXXXX)"
          >
            <Input placeholder="9053XXXXXXXX" />
          </Form.Item>
          <Text type="secondary" style={{ display: "block", marginTop: -8 }}>
            Boş bırakılırsa mağaza telefonundan (Genel Ayarlar) devam eder.
          </Text>
        </SectionCard>

        <SectionCard title="Ürün Sayfası Butonu">
          <Form.Item
            name="whatsapp_product_button_text"
            label="Buton Metni"
            rules={[{ required: true, message: "Buton metni gerekli" }]}
          >
            <Input placeholder="WhatsApp'tan Sor" />
          </Form.Item>
          <Form.Item name="whatsapp_product_message_template" label="Mesaj Şablonu">
            <TextArea rows={6} />
          </Form.Item>
          <Text type="secondary" style={{ display: "block" }}>
            Kullanılabilir değişkenler:{" "}
            <Text code>{`{product_name}`}</Text>, <Text code>{`{product_sku}`}</Text>,{" "}
            <Text code>{`{variant_name}`}</Text>, <Text code>{`{variant_sku}`}</Text>,{" "}
            <Text code>{`{quantity}`}</Text>, <Text code>{`{quantity_prefix}`}</Text>,{" "}
            <Text code>{`{stock_prefix}`}</Text>, <Text code>{`{price}`}</Text>,{" "}
            <Text code>{`{price_prefix}`}</Text>, <Text code>{`{product_url}`}</Text>,{" "}
            <Text code>{`{store_name}`}</Text>
          </Text>
        </SectionCard>

        <SectionCard title="Sepet / Checkout Butonu">
          <Form.Item
            name="whatsapp_cart_button_text"
            label="Buton Metni"
            rules={[{ required: true, message: "Buton metni gerekli" }]}
          >
            <Input placeholder="Sepeti WhatsApp’tan Gönder" />
          </Form.Item>
          <Form.Item name="whatsapp_cart_message_template" label="Mesaj Şablonu">
            <TextArea rows={6} />
          </Form.Item>
          <Text type="secondary" style={{ display: "block" }}>
            Kullanılabilir değişkenler:{" "}
            <Text code>{`{cart_lines}`}</Text>, <Text code>{`{cart_total}`}</Text>,{" "}
            <Text code>{`{cart_restore_url}`}</Text>, <Text code>{`{item_count}`}</Text>,{" "}
            <Text code>{`{store_name}`}</Text>
          </Text>
        </SectionCard>
      </Form>
    </div>
  );
}

export default function WhatsAppSettingsPage() {
  return (
    <StorefrontSettingsProvider>
      <WhatsAppSettingsContent />
    </StorefrontSettingsProvider>
  );
}
