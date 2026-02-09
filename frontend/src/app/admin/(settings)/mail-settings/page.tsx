"use client";

import { Alert, Button, Col, Divider, Form, Input, Row, Select, Typography, message, Space } from "antd";
import {
  MailOutlined,
  SettingOutlined,
  ExperimentOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  SendOutlined,
  GoogleOutlined,
  WindowsOutlined,
  YahooOutlined
} from "@ant-design/icons";
import { useState, useEffect, useMemo } from "react";
import { PageLoader } from "@/components/admin/PageLoader";
import { SectionCard } from "@/components/admin/SectionCard";
import { usePageHeader } from "@/hooks/usePageHeader";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

const { Text, Title, Paragraph } = Typography;

export default function MailSettingsPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("smtp");

  const navItems = useMemo(() => [
    { key: "smtp", label: "SMTP Yapılandırması", icon: <SettingOutlined /> },
    { key: "test", label: "Bağlantı Testi", icon: <ExperimentOutlined /> },
    { key: "tips", label: "Yardım & İpuçları", icon: <InfoCircleOutlined /> },
  ], []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<any>("/api/settings/mail-settings");
      form.setFieldsValue(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      await apiFetch("/api/settings/mail-settings", {
        method: "PUT",
        json: values
      });
      message.success("Mail ayarları başarıyla kaydedildi");
    } catch (e: any) {
      message.error(e.message || "Kaydederken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const sendTestMail = async () => {
    try {
      const email = form.getFieldValue("test_email");
      if (!email) {
        message.warning("Lütfen test e-posta adresi girin");
        return;
      }
      setTestLoading(true);
      await apiFetch("/api/settings/mail-settings/test", { // Mock endpoint or real
        method: "POST",
        json: { test_email: email }
      });
      message.success("Test e-postası gönderildi");
    } catch (e: any) {
      message.error(e.message || "Test gönderimi başarısız");
    } finally {
      setTestLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const container = document.getElementById('admin-focus-content');
      if (container) {
        const top = element.offsetTop - 100;
        container.scrollTo({ top, behavior: 'smooth' });
      } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setActiveTab(id);
    }
  };

  useEffect(() => {
    const scrollContainer = document.getElementById('admin-focus-content');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const containerRect = scrollContainer.getBoundingClientRect();
      const containerTop = containerRect.top;
      const offset = 150;

      let currentSection = navItems[0].key;

      for (const item of navItems) {
        const element = document.getElementById(item.key);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top - containerTop <= offset) {
            currentSection = item.key;
          }
        }
      }
      setActiveTab(currentSection);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [navItems, loading]);

  const headerExtra = (
    <Button
      type="primary"
      icon={<SaveOutlined />}
      onClick={save}
      loading={saving}
      style={{
        height: 40,
        background: '#6f55ff',
        borderRadius: '8px',
        fontWeight: 600,
        padding: '0 24px',
        border: 'none',
        boxShadow: '0 4px 12px rgba(111, 85, 255, 0.2)'
      }}
    >
      Kaydet
    </Button>
  );

  usePageHeader({
    title: "Mail Ayarları",
    breadcrumb: [
      { label: "Genel Ayarlar", href: "/admin/general-settings" }
    ],
    extra: headerExtra,
    variant: 'dark', // Global Edit Style
    onBack: () => router.push('/admin/general-settings')
  });

  if (loading) return <PageLoader />;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Sticky Tabs Header */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 99,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "16px 24px 0 24px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 32, overflowX: "auto", paddingBottom: 12 }}>
            {navItems.map(item => (
              <div
                key={item.key}
                onClick={() => scrollToSection(item.key)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingBottom: 8,
                  borderBottom: activeTab === item.key ? "2px solid #6f55ff" : "2px solid transparent",
                  color: activeTab === item.key ? "#6f55ff" : "#64748b",
                  fontWeight: activeTab === item.key ? 600 : 500,
                  transition: "all 0.2s"
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div
        id="admin-focus-content"
        style={{
          flex: 1,
          overflowY: "auto",
          scrollBehavior: "smooth",
          padding: "32px 24px 100px 24px",
          background: "#f8fafc"
        }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 1000, margin: "0 auto" }}
        >
          {/* SMTP Settings */}
          <SectionCard title="SMTP Yapılandırması" icon={<SettingOutlined />} id="smtp">
            <Alert
              message="SMTP Bilgileri"
              description="E-posta gönderimi için gerekli sunucu bilgilerini girin. Genellikle hosting firmanızdan bu bilgileri temin edebilirsiniz."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="Gönderici Adı (From Name)"
                  name="mail_from_name"
                  rules={[{ required: true, message: 'Zorunlu alan' }]}
                >
                  <Input placeholder="Örn: FabricMarket" prefix={<MailOutlined />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Gönderici E-posta (From Address)"
                  name="mail_from_address"
                  rules={[{ required: true, message: 'Zorunlu alan' }, { type: 'email' }]}
                >
                  <Input placeholder="noreply@domain.com" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row gutter={24}>
              <Col span={16}>
                <Form.Item
                  label="SMTP Sunucu (Host)"
                  name="mail_host"
                  rules={[{ required: true, message: 'Zorunlu alan' }]}
                >
                  <Input placeholder="smtp.domain.com" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Port"
                  name="mail_port"
                  rules={[{ required: true, message: 'Zorunlu alan' }]}
                >
                  <Input placeholder="587" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="SMTP Kullanıcı Adı"
                  name="mail_username"
                >
                  <Input placeholder="user@domain.com" autoComplete="off" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="SMTP Parola"
                  name="mail_password"
                >
                  <Input.Password placeholder="******" autoComplete="new-password" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Şifreleme (Encryption)"
              name="mail_encryption"
            >
              <Select>
                <Select.Option value="tls">TLS (Önerilen)</Select.Option>
                <Select.Option value="ssl">SSL</Select.Option>
                <Select.Option value="">Yok (Güvensiz)</Select.Option>
              </Select>
            </Form.Item>
          </SectionCard>

          {/* Test Area */}
          <SectionCard title="Bağlantı Testi" icon={<ExperimentOutlined />} id="test">
            <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
              Ayarları kaydettikten sonra, bir test e-postası göndererek yapılandırmayı doğrulayın.
            </Text>

            <Row gutter={16} align="bottom">
              <Col span={18}>
                <Form.Item
                  label="Test E-posta Adresi"
                  name="test_email"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="test@ornek.com" prefix={<SendOutlined />} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Button
                  type="default"
                  onClick={sendTestMail}
                  loading={testLoading}
                  block
                >
                  Test Gönder
                </Button>
              </Col>
            </Row>
          </SectionCard>

          {/* Tips */}
          <SectionCard title="Yardım & İpuçları" icon={<InfoCircleOutlined />} id="tips">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, background: "#fff" }}>
                  <Space direction="vertical" align="center" style={{ width: "100%" }}>
                    <GoogleOutlined style={{ fontSize: 24, color: "#ea4335" }} />
                    <Text strong>Gmail</Text>
                    <div style={{ fontSize: 12, textAlign: "center", color: "#64748b" }}>
                      Host: smtp.gmail.com<br />
                      Port: 587 (TLS)<br />
                      Uygulama Şifresi Gerekli
                    </div>
                  </Space>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, background: "#fff" }}>
                  <Space direction="vertical" align="center" style={{ width: "100%" }}>
                    <WindowsOutlined style={{ fontSize: 24, color: "#0078d4" }} />
                    <Text strong>Outlook / Office365</Text>
                    <div style={{ fontSize: 12, textAlign: "center", color: "#64748b" }}>
                      Host: smtp.office365.com<br />
                      Port: 587 (TLS)<br />
                      StartTLS Aktif
                    </div>
                  </Space>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, background: "#fff" }}>
                  <Space direction="vertical" align="center" style={{ width: "100%" }}>
                    <YahooOutlined style={{ fontSize: 24, color: "#6001d2" }} />
                    <Text strong>Yahoo Mail</Text>
                    <div style={{ fontSize: 12, textAlign: "center", color: "#64748b" }}>
                      Host: smtp.mail.yahoo.com<br />
                      Port: 587 (TLS)
                    </div>
                  </Space>
                </div>
              </Col>
            </Row>
          </SectionCard>

        </Form>
      </div>
    </div>
  );
}
