"use client";

import React, { useEffect, useState } from "react";
import { 
    Card, Form, Input, Switch, ColorPicker, 
    InputNumber, Select, Slider, Button, 
    Typography, Divider, App, Spin, Radio 
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/usePageHeader";
import { useStorefrontSettings, StorefrontSettingsProvider } from "@/context/StorefrontSettingsContext";
import { apiFetch } from "@/lib/api";

const { Title, Text } = Typography;

function DesignSettingsContent() {
    const router = useRouter();
    const { message } = App.useApp();
    const { settings, loading, refresh } = useStorefrontSettings();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    usePageHeader({
        title: "Mağaza Tasarım Ayarları",
        breadcrumb: [
            { label: "Ayarlar", href: "/admin/general-settings" },
            { label: "Mağaza Tasarım Ayarları" }
        ],
        onBack: () => router.push("/admin/general-settings"),
    });

    useEffect(() => {
        if (!loading && settings) {
            form.setFieldsValue({
                announcement_enabled: settings.announcement_enabled === "true",
                announcement_text: settings.announcement_text || "3000 TL ÜZERİ KARGO BEDAVA",
                announcement_bg_color: settings.announcement_bg_color || "#ff00a8",
                announcement_text_color: settings.announcement_text_color || "#ffffff",
                announcement_font_size: settings.announcement_font_size ? parseInt(settings.announcement_font_size) : 12,
                announcement_font_family: settings.announcement_font_family || "font-heading",
                announcement_marquee: settings.announcement_marquee === "true",
                announcement_speed: settings.announcement_speed ? parseInt(settings.announcement_speed) : 20,
                announcement_sticky: settings.announcement_sticky === "true",
                storefront_desktop_categories_alignment: settings.storefront_desktop_categories_alignment || "left",
            });
        }
    }, [settings, loading, form]);

    const handleSave = async (values: any) => {
        try {
            setSaving(true);
            
            // Convert values for API
            const payload = {
                ...values,
                announcement_enabled: String(values.announcement_enabled),
                announcement_marquee: String(values.announcement_marquee),
                announcement_sticky: String(values.announcement_sticky),
                announcement_bg_color: typeof values.announcement_bg_color === 'string' 
                    ? values.announcement_bg_color 
                    : values.announcement_bg_color.toHexString(),
                announcement_text_color: typeof values.announcement_text_color === 'string' 
                    ? values.announcement_text_color 
                    : values.announcement_text_color.toHexString(),
                announcement_font_size: String(values.announcement_font_size),
                announcement_speed: String(values.announcement_speed),
            };

            await apiFetch("/api/storefront/settings", {
                method: "POST",
                json: payload,
            });

            await refresh();
            message.success("Ayarlar başarıyla kaydedildi.");
        } catch (error: any) {
            console.error("Save error:", error);
            const errorMsg = error?.message || error?.details?.message || JSON.stringify(error);
            message.error(`Ayarlar kaydedilirken bir hata oluştu: ${errorMsg}`);
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
        <div style={{ padding: "0 24px 40px 24px", maxWidth: 1200, margin: "0 auto" }}>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                    announcement_enabled: true,
                    announcement_text: "3000 TL ÜZERİ KARGO BEDAVA",
                    announcement_bg_color: "#ff00a8",
                    announcement_text_color: "#ffffff",
                    announcement_font_size: 12,
                    announcement_font_family: "font-heading",
                    announcement_marquee: false,
                    announcement_speed: 20,
                    announcement_sticky: true,
                    storefront_desktop_categories_alignment: "left",
                }}
            >
                <Card 
                    title="Duyuru Çubuğu (Header Üst Yazı)" 
                    variant="borderless"
                    extra={
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                            Kaydet
                        </Button>
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <Form.Item
                                name="announcement_enabled"
                                label="Duyuru Çubuğu Aktif"
                                valuePropName="checked"
                            >
                                <Switch checkedChildren="Açık" unCheckedChildren="Kapalı" />
                            </Form.Item>

                            <Form.Item
                                name="announcement_text"
                                label="Duyuru Metni"
                                rules={[{ required: true, message: "Lütfen bir metin girin" }]}
                            >
                                <Input placeholder="Örn: 3000 TL ÜZERİ KARGO BEDAVA" />
                            </Form.Item>

                            <div className="flex gap-4">
                                <Form.Item
                                    name="announcement_bg_color"
                                    label="Arka Plan Rengi"
                                    className="flex-1"
                                >
                                    <ColorPicker showText />
                                </Form.Item>

                                <Form.Item
                                    name="announcement_text_color"
                                    label="Yazı Rengi"
                                    className="flex-1"
                                >
                                    <ColorPicker showText />
                                </Form.Item>
                            </div>

                            <div className="flex gap-4">
                                <Form.Item
                                    name="announcement_font_size"
                                    label="Yazı Boyutu (px)"
                                    className="flex-1"
                                >
                                    <InputNumber min={8} max={32} style={{ width: "100%" }} />
                                </Form.Item>

                                <Form.Item
                                    name="announcement_font_family"
                                    label="Yazı Fontu"
                                    className="flex-1"
                                >
                                    <Select>
                                        <Select.Option value="font-heading">Heading Font (Kalın)</Select.Option>
                                        <Select.Option value="font-sans">Sans Serif (Normal)</Select.Option>
                                        <Select.Option value="font-serif">Serif (Tırnaklı)</Select.Option>
                                    </Select>
                                </Form.Item>
                            </div>
                        </div>

                        <div>
                            <Form.Item
                                name="announcement_sticky"
                                label="Yapışkan (Sticky) Header"
                                valuePropName="checked"
                                help="Aktif edilirse sayfa kaydırıldığında duyuru çubuğu en üstte sabit kalır."
                            >
                                <Switch checkedChildren="Evet" unCheckedChildren="Hayır" />
                            </Form.Item>

                            <Divider />

                            <Form.Item
                                name="announcement_marquee"
                                label="Kayan Yazı (Marquee)"
                                valuePropName="checked"
                                help="Metnin sağdan sola doğru kaymasını sağlar."
                            >
                                <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                            </Form.Item>

                            <Form.Item
                                shouldUpdate={(prev, curr) => prev.announcement_marquee !== curr.announcement_marquee}
                            >
                                {({ getFieldValue }) => 
                                    getFieldValue("announcement_marquee") && (
                                        <Form.Item
                                            name="announcement_speed"
                                            label="Kayma Hızı (Saniye)"
                                            help="Düşük değer daha hızlı, yüksek değer daha yavaş kayar."
                                        >
                                            <Slider min={5} max={60} marks={{ 5: 'Hızlı', 20: 'Normal', 60: 'Yavaş' }} />
                                        </Form.Item>
                                    )
                                }
                            </Form.Item>
                        </div>
                    </div>
                </Card>

                <Divider />

                <Card 
                    title="Menü Ayarları" 
                    variant="borderless"
                    extra={
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                            Kaydet
                        </Button>
                    }
                >
                    <Form.Item
                        name="storefront_desktop_categories_alignment"
                        label="Masaüstü Menü Hizalaması"
                        help="Menü öğelerinin ekranda nasıl hizalanacağını belirler."
                    >
                        <Radio.Group>
                            <Radio.Button value="left">Sola Hizala</Radio.Button>
                            <Radio.Button value="center">Ortala</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                </Card>
            </Form>
        </div>
    );
}

export default function DesignSettingsPage() {
    return (
        <StorefrontSettingsProvider>
            <DesignSettingsContent />
        </StorefrontSettingsProvider>
    );
}
