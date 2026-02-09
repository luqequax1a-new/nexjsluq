"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Switch,
  Tag,
  Typography,
} from "antd";
import { SaveOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { usePageHeader } from "@/hooks/usePageHeader";
import { apiFetch } from "@/lib/api";

const { Text, Title } = Typography;

type SkuSettings = {
  sku_format: string;
  sku_digits_min_length: string;
  sku_digits_prefix: string;
  sku_digits_letters_min_length: string;
  sku_digits_letters_prefix: string;
  sku_digits_letters_uppercase: string;
  sku_custom_template: string;
  sku_product_separator: string;
  sku_variant_format: string;
  sku_variant_suffix: string;
  sku_variant_separator: string;
  sku_auto_generate: string;
  sku_auto_regenerate: string;
  order_ref_prefix: string;
  order_ref_year: string;
  order_ref_min_digits: string;
  order_ref_format: string;
  order_ref_separator: string;
};

type PreviewResponse = {
  product_sku: string;
  variant_sku: string;
  order_number: string;
};

const CUSTOM_TEMPLATE_TAGS = [
  { tag: "{prefix}", desc: "Prefix değeri" },
  { tag: "{name}", desc: "Ürün adı" },
  { tag: "{NAME}", desc: "Ürün adı (büyük harf)" },
  { tag: "{year}", desc: "Yıl (2025)" },
  { tag: "{ye}", desc: "Yıl kısa (25)" },
  { tag: "{month}", desc: "Ay (01-12)" },
  { tag: "{day}", desc: "Gün (01-31)" },
  { tag: "{d:N}", desc: "N haneli rastgele rakam" },
  { tag: "{L:N}", desc: "N harfli büyük harf" },
  { tag: "{l:N}", desc: "N harfli küçük harf" },
];

export default function SkuGeneratorSettingsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [productPreview, setProductPreview] = useState("");
  const [variantPreview, setVariantPreview] = useState("");
  const [orderPreview, setOrderPreview] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selectedFormat = Form.useWatch("sku_format", form) ?? "digits";
  const variantFormat = Form.useWatch("sku_variant_format", form) ?? "product";

  usePageHeader({
    title: "SKU Referans Üretici",
    variant: "light",
    extra: (
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={() => form.submit()}
        loading={saving}
        style={{ background: "#111827", borderColor: "#111827", borderRadius: 6, fontWeight: 500 }}
      >
        Kaydet
      </Button>
    ),
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const settings = await apiFetch<SkuSettings>("/api/products/sku-settings");
      if (settings) {
        form.setFieldsValue(settings);
      }
    } catch {
      message.error("SKU ayarları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [form, message]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      setSaving(true);
      await apiFetch("/api/products/sku-settings", {
        method: "POST",
        json: values,
      });
      message.success("SKU ayarları kaydedildi.");
      void runPreview();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "SKU ayarları kaydedilemedi.";
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const runPreview = useCallback(async (values?: Record<string, unknown>) => {
    try {
      setPreviewLoading(true);
      const payload = { name: "Pamuk Kumaş", ...(values ?? form.getFieldsValue()) };
      const res = await apiFetch<PreviewResponse>("/api/products/sku-preview", {
        method: "POST",
        json: payload,
      });
      setProductPreview(String(res?.product_sku ?? ""));
      setVariantPreview(String(res?.variant_sku ?? ""));
      setOrderPreview(String(res?.order_number ?? ""));
    } catch {
      // silent
    } finally {
      setPreviewLoading(false);
    }
  }, [form]);

  const debouncedPreview = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runPreview(), 400);
  }, [runPreview]);

  useEffect(() => {
    if (!loading) {
      void runPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const cardStyle = { borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 20 };
  const cardBodyStyle = { padding: 20 };
  const sectionTitle = (text: string) => (
    <Title level={5} style={{ margin: "0 0 4px 0", fontSize: 14, color: "#374151" }}>
      {text}
    </Title>
  );

  const previewBox = (bg: string, border: string, value: string) => (
    <div
      style={{
        marginTop: 6,
        padding: "14px 16px",
        background: bg,
        borderRadius: 8,
        border: `1px solid ${border}`,
        minHeight: 48,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Text strong style={{ fontSize: 16, fontFamily: "monospace", letterSpacing: 1 }}>
        {value || "—"}
      </Text>
    </div>
  );

  return (
    <div style={{ padding: "0 24px 80px 24px", maxWidth: 980, margin: "0 auto" }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        onValuesChange={debouncedPreview}
        autoComplete="off"
        initialValues={{
          sku_format: "digits",
          sku_digits_min_length: "5",
          sku_digits_prefix: "",
          sku_digits_letters_min_length: "5",
          sku_digits_letters_prefix: "",
          sku_digits_letters_uppercase: "1",
          sku_custom_template: "{prefix}-{name}-{d:4}",
          sku_product_separator: "-",
          sku_variant_format: "product",
          sku_variant_suffix: "name",
          sku_variant_separator: "-",
          sku_auto_generate: "1",
          sku_auto_regenerate: "0",
          order_ref_prefix: "SIP",
          order_ref_year: "1",
          order_ref_min_digits: "5",
          order_ref_format: "sequential",
          order_ref_separator: "-",
        }}
      >
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ÜRÜN REFERANS FORMATI
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Card loading={loading} title="Ürün Referans Formatı" style={cardStyle} styles={{ body: cardBodyStyle }}>
          <Form.Item
            name="sku_format"
            label="Referans formatı"
            tooltip="Ürün referansları seçilen şablona göre üretilir."
          >
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: "Sadece Rakam", value: "digits" },
                { label: "Rakam + Harf", value: "digits_letters" },
                { label: "Özel Şablon", value: "custom" },
              ]}
            />
          </Form.Item>

          <Divider style={{ margin: "12px 0 16px 0" }} />

          {selectedFormat === "digits" && (
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="sku_digits_min_length" label="Minimum uzunluk" tooltip="Üretilen referanstaki karakter sayısı.">
                  <InputNumber min={1} max={20} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="sku_digits_prefix" label="Prefix" tooltip="Bu metin üretilen referansın başına eklenir.">
                  <Input placeholder="Ör: PRD" maxLength={20} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="sku_product_separator" label="Ayırıcı" tooltip="Prefix ile referans arasındaki karakter. Boş bırakılırsa yapışık yazılır.">
                  <Input placeholder="-" maxLength={5} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {selectedFormat === "digits_letters" && (
            <Row gutter={16}>
              <Col span={5}>
                <Form.Item name="sku_digits_letters_min_length" label="Minimum uzunluk" tooltip="Üretilen referanstaki karakter sayısı.">
                  <InputNumber min={1} max={20} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="sku_digits_letters_prefix" label="Prefix" tooltip="Bu metin üretilen referansın başına eklenir.">
                  <Input placeholder="Ör: SKU" maxLength={20} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="sku_product_separator" label="Ayırıcı" tooltip="Prefix ile referans arasındaki karakter.">
                  <Input placeholder="-" maxLength={5} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  name="sku_digits_letters_uppercase"
                  label="Büyük harf"
                  tooltip="Tüm harfleri büyük harf yapar."
                  valuePropName="checked"
                  getValueFromEvent={(checked: boolean) => (checked ? "1" : "0")}
                  getValueProps={(value: string) => ({ checked: value === "1" })}
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          )}

          {selectedFormat === "custom" && (
            <>
              <Row gutter={16}>
                <Col span={18}>
                  <Form.Item name="sku_custom_template" label="Özel şablon" tooltip="Kullanılabilir değişkenler aşağıda listelenmiştir.">
                    <Input placeholder="{prefix}-{name}-{d:4}" maxLength={255} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="sku_product_separator" label="Ayırıcı" tooltip="Özel şablonda kullanılan ayırıcı (şablon içinde kendiniz de belirleyebilirsiniz).">
                    <Input placeholder="-" maxLength={5} />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {CUSTOM_TEMPLATE_TAGS.map((t) => (
                  <Tag
                    key={t.tag}
                    color="blue"
                    style={{ cursor: "pointer", fontSize: 12 }}
                    onClick={() => {
                      const current = String(form.getFieldValue("sku_custom_template") ?? "");
                      form.setFieldValue("sku_custom_template", current + t.tag);
                    }}
                  >
                    {t.tag} <Text type="secondary" style={{ fontSize: 11 }}>– {t.desc}</Text>
                  </Tag>
                ))}
              </div>
            </>
          )}

          <Divider style={{ margin: "16px 0 12px 0" }} />
          {sectionTitle("Önizleme")}
          {previewBox("#f0fdf4", "#bbf7d0", productPreview)}
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            VARYANT REFERANS FORMATI
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Card loading={loading} title="Varyant Referans Formatı" style={cardStyle} styles={{ body: cardBodyStyle }}>
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="sku_variant_format"
                label="Varyant referans formatı"
                tooltip={'"Devre dışı" = varyantlar için referans üretilmez, "Normal" = ürün formatına göre bağımsız üretilir, "Ürün referansı + ek" = ürün referansına ek eklenir.'}
              >
                <Select
                  options={[
                    { label: "Devre dışı", value: "" },
                    { label: "Normal (bağımsız üretim)", value: "regular" },
                    { label: "Ürün referansı + ek", value: "product" },
                  ]}
                />
              </Form.Item>
            </Col>
            {variantFormat === "product" && (
              <>
                <Col span={8}>
                  <Form.Item
                    name="sku_variant_suffix"
                    label="Ek türü"
                    tooltip={'"Varyant adı" = tam varyant adı eklenir, "Rakam/kısaltma" = sayısal kısaltma, "Rastgele ID" = rastgele rakam.'}
                  >
                    <Select
                      options={[
                        { label: "Varyant adı (Ör: KIRMIZI-XL)", value: "name" },
                        { label: "Rakam / kısaltma (Ör: 60-90)", value: "name_num" },
                        { label: "Rastgele ID (Ör: 483)", value: "" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="sku_variant_separator"
                    label="Ayırıcı"
                    tooltip="Ürün referansı ile varyant eki arasındaki karakter. Boş bırakılırsa yapışık yazılır."
                  >
                    <Input placeholder="-" maxLength={5} />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          <Divider style={{ margin: "16px 0 12px 0" }} />
          {sectionTitle("Önizleme")}
          {previewBox("#eff6ff", "#bfdbfe", variantPreview)}
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SİPARİŞ REFERANS FORMATI
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Card loading={loading} title="Sipariş Referans Formatı" style={cardStyle} styles={{ body: cardBodyStyle }}>
          <Row gutter={16}>
            <Col span={5}>
              <Form.Item name="order_ref_prefix" label="Prefix" tooltip="Sipariş numarasının başına eklenen metin. Ör: SIP, ORD">
                <Input placeholder="SIP" maxLength={20} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="order_ref_year"
                label="Yıl ekle"
                tooltip="Sipariş numarasına yıl bilgisi ekler."
                valuePropName="checked"
                getValueFromEvent={(checked: boolean) => (checked ? "1" : "0")}
                getValueProps={(value: string) => ({ checked: value === "1" })}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="order_ref_min_digits" label="Minimum hane" tooltip="Sıra numarasının minimum karakter sayısı. Ör: 5 = 00001">
                <InputNumber min={1} max={10} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="order_ref_separator" label="Ayırıcı" tooltip="Bölümler arasındaki karakter. Ör: - veya /">
                <Input placeholder="-" maxLength={5} />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="order_ref_format" label="Numara formatı" tooltip="Sıralı = artan numara, Rastgele = rastgele üretim">
                <Select
                  options={[
                    { label: "Sıralı", value: "sequential" },
                    { label: "Rastgele Rakam", value: "random_digits" },
                    { label: "Rastgele Alfanümerik", value: "random_alphanumeric" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "16px 0 12px 0" }} />
          {sectionTitle("Önizleme")}
          {previewBox("#fefce8", "#fde68a", orderPreview)}
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            OTOMATİK ÜRETİM
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Card loading={loading} title="Otomatik Üretim" style={cardStyle} styles={{ body: cardBodyStyle }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="sku_auto_generate"
                label="Ürün oluşturulduğunda otomatik referans üret"
                tooltip="Henüz referansı olmayan ürünler kaydedildiğinde otomatik referans üretilir."
                valuePropName="checked"
                getValueFromEvent={(checked: boolean) => (checked ? "1" : "0")}
                getValueProps={(value: string) => ({ checked: value === "1" })}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sku_auto_regenerate"
                label="Ürün düzenlendiğinde referansı yeniden üret"
                tooltip="Her düzenleme/kaydetme işleminde referans yeniden üretilir."
                valuePropName="checked"
                getValueFromEvent={(checked: boolean) => (checked ? "1" : "0")}
                getValueProps={(value: string) => ({ checked: value === "1" })}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            BİLGİ NOTU
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
          <InfoCircleOutlined style={{ color: "#6b7280" }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Önizlemeler anlık olarak güncellenir. Çakışma durumunda sistem otomatik olarak <Text code>-2</Text>, <Text code>-3</Text> ekler.
          </Text>
        </div>
      </Form>
    </div>
  );
}
