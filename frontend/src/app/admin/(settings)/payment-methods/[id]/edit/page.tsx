"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { App, Button, Card, Form, Input, InputNumber, Select, Space, Switch } from "antd";
import { usePageHeader } from "@/hooks/usePageHeader";
import { apiFetch } from "@/lib/api";
import { PageLoader } from "@/components/admin/PageLoader";
import { RichTextField } from "@/components/admin/RichTextField";

const { TextArea } = Input;

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  description: string;
  enabled: boolean;
  settings: {
    fee_operation?: "add" | "discount";
    fee_type?: "fixed" | "percentage";
    fee_amount?: number;
    fee_percentage?: number;
    bank_info?: string;
    min_amount?: number;
    max_amount?: number;
  };
}

export default function PaymentMethodEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const feeOperation = Form.useWatch("fee_operation", form);
  const feeType = Form.useWatch("fee_type", form);

  const breadcrumb = useMemo(() => {
    return [
      { label: "Ayarlar", href: "/admin/general-settings" },
      { label: "Ödeme Yöntemleri", href: "/admin/payment-methods" },
      { label: "Düzenle" },
    ];
  }, []);

  const fetchPaymentMethod = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<PaymentMethod>(`/api/settings/payment-methods/${id}`);
      setPaymentMethod(data);

      form.setFieldsValue({
        name: data.name,
        code: data.code,
        description: data.description,
        enabled: data.enabled,
        fee_operation: data.settings?.fee_operation ?? "add",
        fee_type: data.settings?.fee_type ?? "fixed",
        fee_amount: data.settings?.fee_amount ?? 0,
        fee_percentage: data.settings?.fee_percentage ?? 0,
        min_amount: data.settings?.min_amount ?? 0,
        max_amount: data.settings?.max_amount ?? 0,
        bank_info: data.settings?.bank_info ?? "",
      });
    } catch (e: any) {
      message.error(e?.message || "Ödeme yöntemi yüklenemedi");
      router.push("/admin/payment-methods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    void fetchPaymentMethod();
  }, [id]);

  const save = async () => {
    try {
      await form.validateFields();
      setSaving(true);

      const values = form.getFieldsValue(true);

      const payload = {
        name: values.name,
        code: values.code,
        description: values.description,
        enabled: values.enabled,
        settings: {
          fee_operation: values.fee_operation ?? "add",
          fee_type: values.fee_type,
          fee_amount: values.fee_amount ?? 0,
          fee_percentage: values.fee_percentage ?? 0,
          min_amount: values.min_amount ?? 0,
          max_amount: values.max_amount ?? 0,
          bank_info: values.bank_info ?? "",
        },
      };

      await apiFetch(`/api/settings/payment-methods/${id}`, {
        method: "PUT",
        json: payload,
      });

      message.success("Ödeme yöntemi güncellendi");
      router.push("/admin/payment-methods");
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  };

  usePageHeader({
    title: paymentMethod?.name ? paymentMethod.name : "Ödeme Yöntemi Düzenle",
    variant: "dark",
    breadcrumb,
    onBack: () => router.push("/admin/payment-methods"),
    onSave: save,
    saving,
  });

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 80px 24px" }}>
      <Form form={form} layout="vertical" onFinish={save} autoComplete="off">
        <Card styles={{ body: { padding: 24 } }} style={{ borderRadius: 10, border: "1px solid #e5e7eb" }}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Form.Item name="enabled" label="Durum" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item name="name" label="Ödeme Yöntemi Adı" rules={[{ required: true, message: "Lütfen ad girin!" }]}>
              <Input placeholder="Örn: Kapıda Ödeme" />
            </Form.Item>

            <Form.Item name="code" label="Kod" rules={[{ required: true, message: "Lütfen kod girin!" }]}>
              <Input placeholder="Örn: cash_on_delivery" disabled />
            </Form.Item>

            <Form.Item name="description" label="Açıklama">
              <RichTextField height={220} placeholder="Ödeme yöntemi hakkında açıklama" />
            </Form.Item>

            <Form.Item name="fee_operation" label="Ücret İşlemi" rules={[{ required: true, message: "Lütfen seçim yapın!" }]}>
              <Select
                options={[
                  { value: "add", label: "Üzerine ekle" },
                  { value: "discount", label: "İndirim uygula" },
                ]}
              />
            </Form.Item>

            <Form.Item name="fee_type" label="Ücret Tipi" rules={[{ required: true, message: "Lütfen ücret tipi seçin!" }]}>
              <Select
                options={[
                  { value: "fixed", label: "Sabit Tutar" },
                  { value: "percentage", label: "Yüzdesel" },
                ]}
              />
            </Form.Item>

            {feeType === "fixed" ? (
              <Form.Item
                name="fee_amount"
                label={feeOperation === "discount" ? "İndirim" : "Ek Ücret"}
                rules={[{ required: true, message: "Lütfen tutar girin!" }]}
              >
                <Space.Compact block>
                  <InputNumber min={0} style={{ width: "100%" }} />
                  <Button disabled>₺</Button>
                </Space.Compact>
              </Form.Item>
            ) : null}

            {feeType === "percentage" ? (
              <Form.Item
                name="fee_percentage"
                label={feeOperation === "discount" ? "İndirim" : "Ek Ücret"}
                rules={[{ required: true, message: "Lütfen yüzde girin!" }]}
              >
                <Space.Compact block>
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                  <Button disabled>%</Button>
                </Space.Compact>
              </Form.Item>
            ) : null}

            <Form.Item name="min_amount" label="Minimum Tutar">
              <Space.Compact block>
                <InputNumber min={0} style={{ width: "100%" }} />
                <Button disabled>₺</Button>
              </Space.Compact>
            </Form.Item>

            <Form.Item name="max_amount" label="Maximum Tutar">
              <Space.Compact block>
                <InputNumber min={0} style={{ width: "100%" }} />
                <Button disabled>₺</Button>
              </Space.Compact>
            </Form.Item>

            {paymentMethod?.code === "bank_transfer" ? (
              <Form.Item name="bank_info" label="Banka Hesap Bilgileri">
                <TextArea rows={4} placeholder="Banka adı, hesap sahibi, IBAN, şube kodu..." />
              </Form.Item>
            ) : null}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => router.push("/admin/payment-methods")}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                Kaydet
              </Button>
            </div>
          </Space>
        </Card>
      </Form>
    </div>
  );
}
