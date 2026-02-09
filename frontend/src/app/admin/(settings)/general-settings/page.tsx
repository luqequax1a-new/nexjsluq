"use client";

import React from "react";
import { App, Card, Row, Col, Typography } from "antd";
import {
    SettingOutlined,
    TeamOutlined,
    PercentageOutlined,
    SafetyCertificateOutlined,
    GlobalOutlined,
    CarOutlined,
    FormatPainterOutlined,
    ProfileOutlined,
    MessageOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/usePageHeader";
import { t } from "@/lib/i18n";

const { Title, Text } = Typography;

interface SettingItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    path: string;
}

interface SettingCategory {
    categoryName: string;
    items: SettingItem[];
}

export default function SettingsDashboard() {
    const router = useRouter();

    usePageHeader({
        title: t('admin.settings.dashboard.title', 'Ayarlar'),
        variant: "light"
    });

    const categories: SettingCategory[] = [
        {
            categoryName: t('admin.settings.dashboard.general_management', 'Genel Yönetim'),
            items: [
                {
                    title: t('admin.settings.dashboard.general_settings_title', 'Mağaza Ayarları'),
                    description: t('admin.settings.dashboard.general_settings_desc', 'Mağaza adı, logo ve genel iletişim bilgilerini yönetin.'),
                    icon: <SettingOutlined />,
                    path: "/admin/general-settings/general"
                },
                {
                    title: "Mağaza Tasarım Ayarları",
                    description: "Header, duyuru çubuğu, renkler ve yazı tiplerini özelleştirin.",
                    icon: <FormatPainterOutlined />,
                    path: "/admin/general-settings/design"
                },
                {
                    title: "WhatsApp Modülü",
                    description: "WhatsApp Business API ile otomatik sipariş bildirimleri ve müşteri iletişimi yönetin.",
                    icon: <MessageOutlined />,
                    path: "/admin/general-settings/whatsapp"
                },
                {
                    title: "SKU Generator",
                    description: "Ürün ve varyant SKU üretim prefix/fallback kurallarını yönetin.",
                    icon: <SyncOutlined />,
                    path: "/admin/general-settings/sku-generator"
                },
                {
                    title: "Destek Merkezi",
                    description: "Mobil Destek Merkezi kartlarının başlıklarını ve alt başlıklarını yönetin.",
                    icon: <MessageOutlined />,
                    path: "/admin/support-center"
                },
                {
                    title: t('admin.settings.dashboard.currencies_title', 'Para Birimleri'),
                    description: t('admin.settings.dashboard.currencies_desc', 'Para birimi formatlarını ve döviz kurlarını yapılandırın.'),
                    icon: <GlobalOutlined />,
                    path: "/admin/general-settings/currencies"
                },
                {
                    title: t('admin.settings.dashboard.tax_title', 'Vergi Ayarları'),
                    description: t('admin.settings.dashboard.tax_desc', 'KDV oranlarını ve vergi sınıflarını yönetin.'),
                    icon: <PercentageOutlined />,
                    path: "/admin/general-settings/tax"
                },
                {
                    title: t('admin.settings.dashboard.translations_title', 'Çeviriler'),
                    description: t('admin.settings.dashboard.translations_desc', 'Sistemdeki tüm metinleri ve çevirileri yönetin (PrestaShop Stili).'),
                    icon: <GlobalOutlined />,
                    path: "/admin/general-settings/translations"
                },
                {
                    title: t('admin.settings.dashboard.shipping_title', 'Kargo Ayarları'),
                    description: t('admin.settings.dashboard.shipping_desc', 'Kargo firmalarını, sabit ücretleri ve ücretsiz kargo barajlarını yönetin.'),
                    icon: <CarOutlined />,
                    path: "/admin/general-settings/shipping"
                },
                {
                    title: "Ödeme Yöntemleri",
                    description: "Mağazanızda kullanılacak ödeme yöntemlerini yönetin.",
                    icon: <PercentageOutlined />,
                    path: "/admin/payment-methods"
                }
            ]
        },
        {
            categoryName: "Ürün Sayfası Ayarları",
            items: [
                {
                    title: "Ürün Detay Sayfası",
                    description: "Benzer ürünler modülü ve ürün detay sayfası ayarlarını yönetin.",
                    icon: <ProfileOutlined />,
                    path: "/admin/general-settings/product-detail"
                },
                {
                    title: "Ürün Sekmeleri",
                    description: "Ürün detayında gösterilecek özel sekmeleri (tüm ürünler/kategori/etiket/ürün bazlı) yönetin.",
                    icon: <ProfileOutlined />,
                    path: "/admin/general-settings/product-tabs"
                }
            ]
        },
        {
            categoryName: t('admin.settings.dashboard.team_and_access', 'Ekip ve Erişim'),
            items: [
                {
                    title: t('admin.settings.dashboard.staff_management_title', 'Personel Yönetimi'),
                    description: t('admin.settings.dashboard.staff_management_desc', 'Yeni ekip üyeleri ekleyin ve hesaplarını yönetin.'),
                    icon: <TeamOutlined />,
                    path: "/admin/general-settings/users"
                },
                {
                    title: t('admin.settings.dashboard.roles_title', 'Roller ve Yetkiler'),
                    description: t('admin.settings.dashboard.roles_desc', 'Personel için erişim seviyelerini ve yetkileri tanımlayın.'),
                    icon: <SafetyCertificateOutlined />,
                    path: "/admin/general-settings/roles"
                }
            ]
        }
    ];

    return (
        <App>
            <div style={{ padding: "0 24px 40px 24px" }}>
                {categories.map((category, catIdx) => (
                    <div key={catIdx} style={{ marginBottom: 48 }}>
                        <Title level={4} style={{ marginBottom: 24, fontWeight: 700, color: "#1a1a1a", fontSize: 18 }}>
                            {category.categoryName}
                        </Title>
                        <Row gutter={[20, 20]}>
                            {category.items.map((item, itemIdx) => (
                                <Col xs={24} sm={12} lg={8} key={itemIdx}>
                                    <Card
                                        hoverable
                                        style={{
                                            borderRadius: 12,
                                            border: "1px solid #f0f0f0",
                                            height: "100%",
                                            transition: "all 0.2s",
                                            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)"
                                        }}
                                        styles={{ body: { padding: "24px" } }}
                                        onClick={() => router.push(item.path)}
                                    >
                                        <div style={{ display: "flex", gap: 16 }}>
                                            <div style={{
                                                flexShrink: 0,
                                                width: 44,
                                                height: 44,
                                                borderRadius: "10px",
                                                background: "#f8fafc",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 20,
                                                color: "#5E5CE6",
                                            }}>
                                                {item.icon}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ marginBottom: 4 }}>
                                                    <Text style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
                                                        {item.title}
                                                    </Text>
                                                </div>
                                                <Text style={{ fontSize: 13, lineHeight: "1.5", color: '#64748b', display: "block" }}>
                                                    {item.description}
                                                </Text>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                ))}

                <style jsx global>{`
                    .ant-card:hover {
                        border-color: #5E5CE6 !important;
                        box-shadow: 0 10px 15px -3px rgba(94, 92, 230, 0.1) !important;
                    }
                `}</style>
            </div>
        </App>
    );
}
