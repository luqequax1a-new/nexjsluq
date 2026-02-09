"use client";

import { App, Button, Card, Form, Input, InputNumber, Select, Switch, Tabs, Typography } from "antd";
import { useEffect, useState } from "react";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import { apiFetch } from "@/lib/api";
import { usePageHeader } from "@/hooks/usePageHeader";

const { TextArea } = Input;
const { Text } = Typography;

const CHANGEFREQ_OPTIONS = [
  { value: "always", label: "Her zaman" },
  { value: "hourly", label: "Saatlik" },
  { value: "daily", label: "Günlük" },
  { value: "weekly", label: "Haftalık" },
  { value: "monthly", label: "Aylık" },
  { value: "yearly", label: "Yıllık" },
  { value: "never", label: "Asla" },
];

const PRIORITY_OPTIONS = [
  { value: "1.0", label: "1.0 (En yüksek)" },
  { value: "0.9", label: "0.9" },
  { value: "0.8", label: "0.8" },
  { value: "0.7", label: "0.7" },
  { value: "0.6", label: "0.6" },
  { value: "0.5", label: "0.5 (Varsayılan)" },
  { value: "0.4", label: "0.4" },
  { value: "0.3", label: "0.3" },
  { value: "0.2", label: "0.2" },
  { value: "0.1", label: "0.1 (En düşük)" },
];

export default function AdminSitemapPage() {
  const { message } = App.useApp();
  const [configForm] = Form.useForm();
  const [robotsForm] = Form.useForm();
  const [configLoading, setConfigLoading] = useState(false);
  const [robotsLoading, setRobotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  usePageHeader({
    title: "Sitemap & Robots.txt",
    breadcrumb: [{ label: "SEO" }, { label: "Sitemap" }],
  });

  const loadConfig = async () => {
    setConfigLoading(true);
    try {
      const data = await apiFetch<any>("/api/sitemap/config");
      configForm.setFieldsValue(data);
    } catch (e: any) {
      message.error(e?.message || "Sitemap ayarları yüklenemedi");
    } finally {
      setConfigLoading(false);
    }
  };

  const loadRobots = async () => {
    setRobotsLoading(true);
    try {
      const data = await apiFetch<any>("/api/sitemap/robots");
      robotsForm.setFieldsValue({ content: data?.content || "" });
    } catch (e: any) {
      message.error(e?.message || "robots.txt yüklenemedi");
    } finally {
      setRobotsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    loadRobots();
  }, []);

  const saveConfig = async () => {
    try {
      const values = await configForm.validateFields();
      setSaving(true);
      await apiFetch("/api/sitemap/config", { method: "POST", json: values });
      message.success("Sitemap ayarları kaydedildi");
    } catch (e: any) {
      if (e?.message) message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveRobots = async () => {
    try {
      const values = await robotsForm.validateFields();
      setSaving(true);
      await apiFetch("/api/sitemap/robots", { method: "POST", json: values });
      message.success("robots.txt kaydedildi");
    } catch (e: any) {
      if (e?.message) message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const resetRobots = async () => {
    try {
      setSaving(true);
      const data = await apiFetch<any>("/api/sitemap/robots/reset", { method: "POST" });
      robotsForm.setFieldsValue({ content: data?.content || "" });
      message.success("robots.txt varsayılana sıfırlandı");
    } catch (e: any) {
      if (e?.message) message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const sitemapUrl = typeof window !== "undefined"
    ? `${window.location.origin}/sitemap.xml`
    : "/sitemap.xml";

  const tabItems = [
    {
      key: "sitemap",
      label: "Sitemap Ayarları",
      forceRender: true,
      children: (
        <Form form={configForm} layout="vertical" disabled={configLoading}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Dahil Edilecek İçerikler" size="small">
              <Form.Item name="include_products" label="Ürünler" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="include_categories" label="Kategoriler" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="include_brands" label="Markalar" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="include_pages" label="Sayfalar" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="include_static" label="Statik Sayfalar" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="include_images" label="Ürün Görselleri" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="products_per_sitemap" label="Sitemap Başına Ürün Sayısı">
                <InputNumber min={100} max={50000} style={{ width: "100%" }} />
              </Form.Item>
            </Card>

            <Card title="Güncelleme Sıklığı & Öncelik" size="small">
              <div className="space-y-4">
                <div>
                  <Text strong className="block mb-2">Ürünler</Text>
                  <div className="grid grid-cols-2 gap-2">
                    <Form.Item name="products_changefreq" noStyle>
                      <Select options={CHANGEFREQ_OPTIONS} placeholder="Sıklık" />
                    </Form.Item>
                    <Form.Item name="products_priority" noStyle>
                      <Select options={PRIORITY_OPTIONS} placeholder="Öncelik" />
                    </Form.Item>
                  </div>
                </div>
                <div>
                  <Text strong className="block mb-2">Kategoriler</Text>
                  <div className="grid grid-cols-2 gap-2">
                    <Form.Item name="categories_changefreq" noStyle>
                      <Select options={CHANGEFREQ_OPTIONS} placeholder="Sıklık" />
                    </Form.Item>
                    <Form.Item name="categories_priority" noStyle>
                      <Select options={PRIORITY_OPTIONS} placeholder="Öncelik" />
                    </Form.Item>
                  </div>
                </div>
                <div>
                  <Text strong className="block mb-2">Markalar</Text>
                  <div className="grid grid-cols-2 gap-2">
                    <Form.Item name="brands_changefreq" noStyle>
                      <Select options={CHANGEFREQ_OPTIONS} placeholder="Sıklık" />
                    </Form.Item>
                    <Form.Item name="brands_priority" noStyle>
                      <Select options={PRIORITY_OPTIONS} placeholder="Öncelik" />
                    </Form.Item>
                  </div>
                </div>
                <div>
                  <Text strong className="block mb-2">Sayfalar</Text>
                  <div className="grid grid-cols-2 gap-2">
                    <Form.Item name="pages_changefreq" noStyle>
                      <Select options={CHANGEFREQ_OPTIONS} placeholder="Sıklık" />
                    </Form.Item>
                    <Form.Item name="pages_priority" noStyle>
                      <Select options={PRIORITY_OPTIONS} placeholder="Öncelik" />
                    </Form.Item>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Text type="secondary">
              Sitemap URL: <a href={sitemapUrl} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{sitemapUrl}</a>
            </Text>
            <Button type="primary" icon={<SaveOutlined />} onClick={saveConfig} loading={saving}>
              Kaydet
            </Button>
          </div>
        </Form>
      ),
    },
    {
      key: "robots",
      label: "Robots.txt",
      forceRender: true,
      children: (
        <Form form={robotsForm} layout="vertical" disabled={robotsLoading}>
          <Form.Item
            name="content"
            label="robots.txt İçeriği"
            rules={[{ required: true, message: "robots.txt boş olamaz" }]}
          >
            <TextArea rows={14} style={{ fontFamily: "monospace", fontSize: 13 }} />
          </Form.Item>

          <div className="flex items-center gap-3 justify-end">
            <Button icon={<ReloadOutlined />} onClick={resetRobots} loading={saving}>
              Varsayılana Sıfırla
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={saveRobots} loading={saving}>
              Kaydet
            </Button>
          </div>
        </Form>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Tabs items={tabItems} />
    </div>
  );
}
