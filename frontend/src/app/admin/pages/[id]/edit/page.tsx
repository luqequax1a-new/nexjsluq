"use client";

import { App, Col, Form, Input, Row } from "antd";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DeleteOutlined, EyeOutlined, StopOutlined, CheckOutlined } from "@ant-design/icons";

import { apiFetch } from "@/lib/api";
import { usePageHeader } from "@/hooks/usePageHeader";
import { SectionCard } from "@/components/admin/SectionCard";
import { RichTextField } from "@/components/admin/RichTextField";
import { SeoSection } from "@/components/admin/shared/SeoSection";

export default function AdminPageEdit() {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isPublished = Form.useWatch("is_published", form);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiFetch<any>(`/api/settings/pages/${id}`);
      const page = res?.page;
      form.setFieldsValue({
        title: page?.title || "",
        slug: page?.slug || "",
        excerpt: page?.excerpt || "",
        content_html: page?.content_html || "",
        meta_title: page?.meta_title || "",
        meta_description: page?.meta_description || "",
        is_published: !!page?.is_published,
      });
    } catch (e: any) {
      message.error(e?.message || "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const save = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await apiFetch<any>(`/api/settings/pages/${id}`, {
        method: "PUT",
        json: values,
      });
      message.success("Kaydedildi");
      void load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (next: boolean) => {
    try {
      await apiFetch<any>(`/api/settings/pages/${id}/toggle`, {
        method: "PUT",
        json: { is_published: next },
      });
      form.setFieldValue("is_published", next);
      message.success(next ? "Yayına alındı" : "Pasif yapıldı");
      void load();
    } catch (e: any) {
      message.error(e?.message || "İşlem başarısız");
    }
  };

  const handleDelete = () => {
    modal.confirm({
      title: "Silmek istediğinize emin misiniz?",
      content: "Bu işlem geri alınamaz.",
      okText: "Sil",
      okType: "danger",
      cancelText: "Vazgeç",
      onOk: async () => {
        try {
          await apiFetch(`/api/settings/pages/${id}`, { method: "DELETE" });
          message.success("Silindi");
          router.push("/admin/pages");
        } catch (e: any) {
          message.error(e?.message || "Silinemedi");
        }
      },
    });
  };

  const pageActions = useMemo(() => {
    const items: any[] = [
      {
        key: "view",
        icon: <EyeOutlined />,
        label: "Önizle",
        onClick: () => window.open(`/${encodeURIComponent(String(form.getFieldValue("slug") || ""))}`, "_blank"),
      },
    ];

    if (isPublished) {
      items.push({
        key: "unpublish",
        icon: <StopOutlined />,
        label: "Pasif Yap",
        onClick: () => void togglePublish(false),
      });
    } else {
      items.push({
        key: "publish",
        icon: <CheckOutlined />,
        label: "Yayınla",
        onClick: () => void togglePublish(true),
      });
    }

    items.push({
      key: "delete",
      icon: <DeleteOutlined />,
      danger: true,
      label: "Sil",
      onClick: handleDelete,
    });

    return items;
  }, [form, id, isPublished]);

  usePageHeader({
    title: loading ? "Sayfa" : (form.getFieldValue("title") || "Sayfa"),
    variant: "dark",
    breadcrumb: [{ label: "Sayfalar", href: "/admin/pages" }],
    onBack: () => router.back(),
    onSave: save,
    saving,
    actions: pageActions,
  });

  return (
    <div style={{ background: "transparent" }}>
      <div style={{ maxWidth: 1200, margin: "50px auto 0" }}>
        <Form form={form} layout="vertical">
          <SectionCard title="Genel Bilgiler">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="title" label="Başlık" rules={[{ required: true, message: "Başlık zorunludur" }]}
                >
                  <Input size="large" placeholder="Başlık" />
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
