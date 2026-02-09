"use client";

import { App, Button, Card, Form, Select, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { SaveOutlined } from "@ant-design/icons";
import { usePageHeader } from "@/hooks/usePageHeader";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import { getMenus } from "@/lib/api/menus";
import { trSelectFilterOption } from "@/lib/trSearch";

const { Title, Paragraph } = Typography;

export default function StorefrontSettingsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menus, setMenus] = useState<Array<{ id: number; name: string; code: string }>>([]);

  const menuOptions = useMemo(
    () =>
      menus.map((m) => ({
        value: m.code,
        label: `${m.name} (${m.code})`,
      })),
    [menus]
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settings, menusRes] = await Promise.all([
        apiFetch<any>("/api/settings/general"),
        getMenus(),
      ]);

      setMenus(menusRes.menus || []);

      form.setFieldsValue({
        storefront_primary_menu: settings?.storefront_primary_menu || "",
        storefront_categories_menu: settings?.storefront_categories_menu || "",
        storefront_categories_top_menu: settings?.storefront_categories_top_menu || "",
        storefront_more_menu: settings?.storefront_more_menu || "",
      });
    } catch (e: any) {
      message.error(e?.message || t("admin.common.load_failed", "Yüklenemedi"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      await apiFetch("/api/settings/general", {
        method: "POST",
        json: {
          storefront_primary_menu: values.storefront_primary_menu || "",
          storefront_categories_menu: values.storefront_categories_menu || "",
          storefront_categories_top_menu: values.storefront_categories_top_menu || "",
          storefront_more_menu: values.storefront_more_menu || "",
        },
      });

      message.success(t("admin.common.saved", "Kaydedildi"));
      window.dispatchEvent(new Event("settings-updated"));
    } catch (e: any) {
      if (e?.status) {
        message.error(e?.message || t("admin.common.save_failed", "Kaydedilemedi"));
      }
    } finally {
      setSaving(false);
    }
  };

  usePageHeader({
    title: t("admin.settings.storefront.title", "Storefront"),
    variant: "light",
    extra: (
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={handleSave}
        loading={saving}
        style={{ background: "#111827", borderColor: "#111827", borderRadius: 6, fontWeight: 500 }}
      >
        {t("admin.common.save", "Kaydet")}
      </Button>
    ),
  });

  return (
    <div style={{ padding: "0 24px 80px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 4, fontWeight: 600 }}>
          {t("admin.settings.storefront.menus.title", "Menüler")}
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
          {t(
            "admin.settings.storefront.menus.desc",
            "Storefront header ve mobil menüde hangi menülerin gösterileceğini seçin."
          )}
        </Paragraph>
      </div>

      <Card styles={{ body: { padding: 24 } }} style={{ borderRadius: 8, border: "1px solid #e5e7eb" }}>
        <Form form={form} layout="vertical" disabled={loading}>
          <Form.Item
            name="storefront_primary_menu"
            label={t("admin.settings.storefront.primary_menu", "Primary Menü (Desktop + Mobil Menü Sekmesi)")}
          >
            <Select
              allowClear
              placeholder={t("admin.settings.storefront.select_menu", "Menü seçin")}
              options={menuOptions}
              showSearch
              filterOption={trSelectFilterOption}
            />
          </Form.Item>

          <Form.Item
            name="storefront_categories_menu"
            label={t("admin.settings.storefront.categories_menu", "Kategoriler Menüsü (Desktop 'Tüm Kategoriler' + Mobil Kategoriler Sekmesi)")}
          >
            <Select
              allowClear
              placeholder={t("admin.settings.storefront.select_menu", "Menü seçin")}
              options={menuOptions}
              showSearch
              filterOption={trSelectFilterOption}
            />
          </Form.Item>

          <Form.Item
            name="storefront_categories_top_menu"
            label={t("admin.settings.storefront.categories_top_menu", "Desktop Yatay Kategoriler (Üst Kategori Linkleri)")}
          >
            <Select
              allowClear
              placeholder={t("admin.settings.storefront.select_menu", "Menü seçin")}
              options={menuOptions}
              showSearch
              filterOption={trSelectFilterOption}
            />
          </Form.Item>

          <Form.Item name="storefront_more_menu" label={t("admin.settings.storefront.more_menu", "More Menü (Mobil 'Daha')")}
          >
            <Select
              allowClear
              placeholder={t("admin.settings.storefront.select_menu", "Menü seçin")}
              options={menuOptions}
              showSearch
              filterOption={trSelectFilterOption}
            />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
