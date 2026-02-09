"use client";

import { App, Button, Col, Form, Input, Row } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/api";
import { usePageHeader } from "@/hooks/usePageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { RichTextField } from "@/components/admin/RichTextField";
import { SeoSection } from "@/components/admin/shared/SeoSection";

export default function AdminPageNew() {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await apiFetch<any>("/api/settings/pages", {
        method: "POST",
        json: values,
      });
      message.success("Kaydedildi");
      const id = res?.page?.id;
      router.push(id ? `/admin/pages/${id}/edit` : "/admin/pages");
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  usePageHeader({
    title: "Yeni Sayfa",
    variant: "dark",
    breadcrumb: [{ label: "Sayfalar", href: "/admin/pages" }],
    onBack: () => router.back(),
    onSave: save,
    saving,
  });

  return (
    <div style={{ background: "transparent" }}>
      <div style={{ maxWidth: 1200, margin: "50px auto 0" }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            title: "",
            slug: "",
            excerpt: "",
            content_html: "",
            meta_title: "",
            meta_description: "",
            is_published: false,
          }}
        >
          <SectionCard title="Genel Bilgiler">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="title" label="Başlık" rules={[{ required: true, message: "Başlık zorunludur" }]}
                >
                  <Input size="large" placeholder="Örn: Gizlilik Politikası" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="excerpt" label="Kısa Açıklama">
                  <Input.TextArea rows={3} placeholder="Liste ekranı için kısa açıklama" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="content_html" label="İçerik">
                  <RichTextField height={520} placeholder="Sayfa içeriği..." />
                </Form.Item>
              </Col>
            </Row>
          </SectionCard>

          <SectionCard title="SEO">
            <SeoSection entityType="page" nameFieldName="title" />
          </SectionCard>
        </Form>
      </div>
    </div>
  );
}
