"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { App as AntdApp, Layout, Menu, Button, Dropdown, Drawer, ConfigProvider } from "antd";
import {
  AppstoreOutlined,
  LogoutOutlined,
  PictureOutlined,
  MoreOutlined,
  SettingOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  TeamOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  UserOutlined,
  TagOutlined,
  BgColorsOutlined,
  ThunderboltOutlined,
  SwapOutlined
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { PageHeader } from "./PageHeader";
import { useAuth, hasPermission } from "@/lib/auth";
import { usePageHeaderContext } from "@/context/PageHeaderContext";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useI18n } from "@/context/I18nContext";
import { PageLoader } from "@/components/admin/PageLoader";

const { Header, Sider, Content } = Layout;

interface AdminShellProps {
  children: React.ReactNode;
}

const findParentKey = (items: any[] = [], targetKey: string): string | null => {
  for (const item of items) {
    if (!item) continue;
    if (String(item.key) === targetKey && Array.isArray(item.children) && item.children.length > 0) {
      return String(item.key);
    }
    if (Array.isArray(item.children)) {
      if (item.children.some((child: any) => String(child?.key) === targetKey)) {
        return String(item.key);
      }
      const nested = findParentKey(item.children, targetKey);
      if (nested) {
        return String(item.key);
      }
    }
  }
  return null;
};

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { me, logout } = useAuth();
  const { headerState } = usePageHeaderContext();

  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [settings, setSettings] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('app_settings');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return {};
        }
      }
    }
    return {};
  });

  const fetchSettings = async () => {
    try {
      const data = await apiFetch<any>("/api/settings/general");
      setSettings(data);
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_settings', JSON.stringify(data));
      }
    } catch (e) { }
  };

  useEffect(() => {
    fetchSettings();
    const handleSettingsUpdate = () => {
      fetchSettings();
    };
    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('settings-updated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    if (
      pathname.startsWith('/admin/general-settings') ||
      pathname.startsWith('/admin/mail-settings') ||
      pathname.startsWith('/admin/whatsapp-settings') ||
      pathname.startsWith('/admin/payment-methods')
    ) {
      return () => {
        fetchSettings();
      };
    }
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 992;
      setIsDesktop(desktop);
      if (!desktop) setCollapsed(true);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const navigateTo = (to: string) => {
    const next = String(to || "");
    if (!next) return;
    if (next === pathname) return;
    setIsNavigating(true);
    router.push(next);
  };

  const baseMenuItems = useMemo(() => {
    const items = [
      { key: "/admin", icon: <DashboardOutlined />, label: t("admin.dashboard.title", "Dashboard") },
      {
        key: "sales",
        icon: <ShoppingOutlined />,
        label: t("admin.sales.title", "Satışlar"),
        children: [
          { key: "/admin/orders", label: t("admin.orders.title", "Siparişler"), permission: "orders.index" },
          { key: "/admin/customers", label: t("admin.customers.title", "Müşteriler"), permission: "customers.index" },
          { key: "/admin/customers/groups", label: t("admin.customer_groups.title", "Müşteri Grupları"), permission: "customer_groups.index" },
        ].filter(item => !item.permission || hasPermission(me, item.permission))
      },
      {
        key: "catalog",
        icon: <AppstoreOutlined />,
        label: t("admin.catalog.title", "Katalog"),
        children: [
          { key: "/admin/products", label: t("admin.products.title", "Ürünler"), permission: "products.index" },
          { key: "/admin/categories", label: t("admin.categories.title", "Kategoriler"), permission: "categories.index" },
          { key: "/admin/brands", label: t("admin.brands.title", "Markalar"), permission: "brands.index" },
          { key: "/admin/products/variations", label: t("admin.variations.title", "Varyant Tanımları"), permission: "variations.index" },
          { key: "/admin/options", label: t("admin.options.title", "Seçenekler"), permission: "options.index" },
          { key: "/admin/attribute-sets", label: t("admin.attributes.title", "Özellik Setleri"), permission: "attributes.index" },
          { key: "/admin/tags", label: t("admin.tags.title", "Etiketler"), permission: "tags.index" },
          { key: "/admin/units", label: t("admin.units.title", "Birim Ayarları"), permission: "units.index" },
        ].filter(item => !item.permission || hasPermission(me, item.permission))
      },
      {
        key: "/admin/media",
        icon: <PictureOutlined />,
        label: t("admin.media.title", "Medya Kütüphanesi"),
        permission: "media.index"
      },
      {
        key: "marketing",
        icon: <TagOutlined />,
        label: t("admin.marketing.title", "Pazarlama"),
        children: [
          { key: "/admin/marketing/coupons", label: t("admin.marketing.coupons.title", "İndirim Kuponları"), permission: "coupons.index" },
          { key: "/admin/marketing/coupons/reports", label: t("admin.marketing.coupons.reports.title", "Kampanya Raporları"), permission: "coupons.index" },
        ].filter(item => !item.permission || hasPermission(me, item.permission))
      },
      {
        key: "automations",
        icon: <ThunderboltOutlined />,
        label: "Otomasyonlar",
        children: [
          { key: "/admin/marketing/cart-offers", label: "Sepet Teklifleri", permission: "coupons.index" },
          { key: "/admin/whatsapp-settings", label: "Whatsapp Otomasyonu", permission: "settings.edit" },
        ].filter(item => !item.permission || hasPermission(me, item.permission))
      },
      {
        key: "/admin/pages",
        icon: <FileTextOutlined />,
        label: "Sayfalar",
        permission: "settings.edit"
      },
      {
        key: "seo",
        icon: <SwapOutlined />,
        label: "SEO",
        permission: "settings.edit",
        children: [
          { key: "/admin/sitemap", label: "Sitemap & Robots.txt", permission: "settings.edit" },
          { key: "/admin/redirects", label: "Yönlendirmeler", permission: "settings.edit" },
        ].filter(item => !item.permission || hasPermission(me, item.permission))
      },
      {
        key: "settings",
        icon: <SettingOutlined />,
        label: t("admin.settings.title", "Ayarlar"),
        permission: "settings.edit",
        children: [
          { key: "/admin/general-settings", label: "Genel Ayarlar", permission: "settings.edit" },
          { key: "/admin/mail-settings", label: "Mail Ayarları", permission: "settings.edit" },
        ].filter(item => !item.permission || hasPermission(me, item.permission))
      },
      {
        key: "/admin/appearance/section-builder",
        icon: <BgColorsOutlined />,
        label: "Tema Düzenleyici",
        permission: "settings.edit"
      },
      {
        key: "/admin/menus",
        icon: <BgColorsOutlined />,
        label: t("admin.menus.title", "Menüler"),
        permission: "settings.edit"
      }
    ];

    return items
      .filter(item => {
        if (item.permission && !hasPermission(me, item.permission)) return false;
        if (item.children && item.children.length === 0) return false;
        return true;
      });
  }, [me]);

  const selectedParentKey = useMemo(() => {
    return findParentKey(baseMenuItems, String(pathname));
  }, [baseMenuItems, pathname]);

  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    return selectedParentKey ? [selectedParentKey] : [];
  });

  useEffect(() => {
    if (collapsed) {
      setOpenKeys([]);
      return;
    }
    if (selectedParentKey) {
      setOpenKeys([selectedParentKey]);
    } else {
      setOpenKeys([]);
    }
  }, [collapsed, selectedParentKey]);

  const handleOpenChange = useCallback((keys: string[]) => {
    if (collapsed) return;
    const latest = keys[keys.length - 1];
    setOpenKeys(latest ? [String(latest)] : []);
  }, [collapsed]);

  const profileMenuItems = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: t('admin.profile.my_account', 'Hesabım') },
      { key: 'settings', icon: <SettingOutlined />, label: t('admin.settings.title', 'Ayarlar'), onClick: () => navigateTo('/admin/general-settings') },
      { key: 'logout', icon: <LogoutOutlined />, label: t('admin.profile.logout', 'Güvenli Çıkış'), danger: true, onClick: () => logout() },
    ]
  };



  const menu = (
    <div className="ikas-menu-container">
      <ConfigProvider
        theme={{
          token: {
            colorText: "#ececed",
            colorTextDescription: "#9c9c9f",
            fontWeightStrong: 600,
          },
          components: {
            Menu: {
              itemBg: "transparent",
              itemColor: "#ececed",
              itemSelectedBg: "#2e2e33",
              itemSelectedColor: "#ffffff",
              itemHoverBg: "rgba(255,255,255,0.05)",
              itemHoverColor: "#ffffff",
              groupTitleColor: "#5e6a75",
              darkItemBg: "transparent",
              darkItemSelectedBg: "#2e2e33",
              darkItemColor: "#ececed",
              darkItemSelectedColor: "#ffffff",
              itemMarginInline: 8,
              itemBorderRadius: 8,
            }
          }
        }}
      >
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={baseMenuItems}
          openKeys={collapsed ? undefined : openKeys}
          onOpenChange={collapsed ? undefined : handleOpenChange}
          onClick={({ key }) => navigateTo(String(key))}
          style={{ background: "transparent", border: "none" }}
        />
      </ConfigProvider>
    </div>
  );

  const globalStyles = (
    <style jsx global>{`
      /* Premium Notifications & Messages */
      .ant-message .ant-message-notice-content {
        background: #111827 !important;
        border-radius: 8px !important;
        padding: 10px 20px !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
      }
      .ant-message .ant-message-notice-content * {
        color: #ffffff !important;
        font-weight: 500 !important;
      }
      .ant-notification-notice {
        background: #111827 !important;
        border-radius: 8px !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
      }
      .ant-notification-notice * {
        color: #ffffff !important;
      }
      .ant-notification-notice-message {
        font-weight: 700 !important;
        color: #ffffff !important;
      }
      .ant-notification-notice-description {
        color: #94a3b8 !important;
      }
      .ant-notification-notice-close {
        color: #94a3b8 !important;
      }

      .ikas-sidebar {
        --sidebar-menu-item-size: 40px;
        --sidebar-text-color: #ececed;
        --sidebar-hover-text-color: #f8fafc;
        --sidebar-bg-color: #000000;
        --sidebar-hover-bg-color: #2e2e33;
        --sidebar-footer-border-color: #2e2e33;
        --sidebar-header-border-color: #1a1a1a;
        
        background-color: var(--sidebar-bg-color) !important;
        border-right: none !important;
        transition: all 0.3s cubic-bezier(0.2, 0, 0, 1) !important;
        height: 100vh !important;
        z-index: 100 !important;
      }
      .ikas-sidebar .ant-layout-sider-children {
        display: flex;
        flex-direction: column;
        padding: clamp(8px, 2vw, 16px) 0;
        overflow-x: hidden;
      }
      .ikas-menu-container .ant-menu {
        background: transparent !important;
        border: none !important;
      }
      .ikas-menu-container .ant-menu-item,
      .ikas-menu-container .ant-menu-submenu-title {
        height: clamp(36px, 5vw, var(--sidebar-menu-item-size)) !important;
        line-height: clamp(36px, 5vw, var(--sidebar-menu-item-size)) !important;
        border-radius: 8px !important;
        margin-bottom: 2px !important;
        font-weight: 500 !important;
        font-size: clamp(12px, 2vw, 13.5px) !important;
      }
      .ikas-menu-container .ant-menu-submenu-arrow {
        opacity: 0 !important;
        transition: opacity 0.18s ease !important;
      }
      .ikas-menu-container .ant-menu-submenu:hover > .ant-menu-submenu-title .ant-menu-submenu-arrow {
        opacity: 1 !important;
      }
      .sidebar-logo-container {
        padding: 0 clamp(8px, 2vw, 16px);
        margin-bottom: clamp(16px, 3vw, 24px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: clamp(40px, 6vw, 50px);
      }
      .sidebar-logo-container img {
        max-width: 170px;
        max-height: 48px;
        object-fit: contain;
      }
      .collapsed-logo-area {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }
      .collapsed-icon-box {
        width: clamp(32px, 4vw, 36px);
        height: clamp(32px, 4vw, 36px);
        background: #2e2e33;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        color: #6f55ff;
        font-size: clamp(16px, 3vw, 18px);
      }

      /* Hide scrollbar for Chrome, Safari and Opera */
      .sidebar-scrollbar::-webkit-scrollbar,
      .ikas-sidebar .ant-layout-sider-children::-webkit-scrollbar {
        display: none !important;
      }

      /* Hide scrollbar for IE, Edge and Firefox */
      .sidebar-scrollbar,
      .ikas-sidebar .ant-layout-sider-children {
        -ms-overflow-style: none !important;  /* IE and Edge */
        scrollbar-width: none !important;  /* Firefox */
      }
    `}</style>
  );

  const isFocusMode = headerState.variant === 'dark';

  return (
    <AntdApp>
      <Layout style={{ height: "100vh", overflow: "hidden", background: "#ffffff" }}>
        {globalStyles}
        {!isFocusMode && (
          <Sider
            width={260}
            collapsed={isDesktop ? collapsed : true}
            collapsedWidth={isDesktop ? 80 : 0}
            trigger={null}
            className="ikas-sidebar"
          >
            {collapsed ? (
              <div className="collapsed-logo-area">
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {settings.logo ? (
                    <img
                      src={settings.logo}
                      alt="Logo"
                      style={{ maxWidth: 48, maxHeight: 48, objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="collapsed-icon-box">{(settings.store_name || "FabricMarket").charAt(0).toUpperCase()}</div>
                  )}
                </button>
              </div>
            ) : (
              <div className="sidebar-logo-container">
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {settings.logo ? (
                    <img src={settings.logo} alt="Logo" />
                  ) : (
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', letterSpacing: -0.8, whiteSpace: 'nowrap' }}>
                      {settings.store_name || "FabricMarket"}
                    </span>
                  )}
                </button>
                <Button
                  type="text"
                  icon={<MenuFoldOutlined />}
                  onClick={() => setCollapsed(true)}
                  style={{ color: "#9c9c9f", fontSize: 18 }}
                />
              </div>
            )}

            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }} className="sidebar-scrollbar">
              {menu}
            </div>

            <div style={{ marginTop: 'auto', padding: '16px 16px 8px 16px', borderTop: '1px solid #1a1a1a' }}>
              <Dropdown menu={profileMenuItems} placement="topRight">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start' }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: "12px",
                    background: "#2e2e33",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 600,
                    flexShrink: 0
                  }}>
                    {me?.user?.name?.charAt(0) || "A"}
                  </div>
                  {!collapsed && (
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ color: "#f8fafc", fontWeight: 600, fontSize: 13, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {me?.user?.name || t('admin.profile.admin_label', 'Yönetici')}
                      </div>
                      <div style={{ color: "#5e6a75", fontSize: 11, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {me?.user?.email}
                      </div>
                    </div>
                  )}
                </div>
              </Dropdown>
            </div>
          </Sider>
        )}

        <Layout style={{
          background: "rgb(248, 250, 252)",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}>
          <div style={{ flex: "0 0 auto", zIndex: 90 }}>
            <PageHeader
              title={headerState.title}
              breadcrumb={headerState.breadcrumb}
              onBack={headerState.onBack}
              onSave={headerState.onSave}
              saving={headerState.saving}
              extra={headerState.extra}
              footer={headerState.footer}
              actions={headerState.actions}
              variant={headerState.variant || "light"}
            />
          </div>

          <Content className="sidebar-scrollbar" style={{
            flex: 1,
            overflowY: "auto",
            padding: headerState.variant === 'dark' ? "0" : "clamp(12px, 3vw, 24px)",
            background: headerState.variant === 'dark' ? "#f9fafb" : "#ffffff",
            position: "relative"
          }}>
            {isNavigating && <PageLoader />}
            {children}
          </Content>

        </Layout>
      </Layout>
    </AntdApp>
  );
}
