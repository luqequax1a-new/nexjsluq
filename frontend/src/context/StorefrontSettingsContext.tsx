"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

export type StorefrontSettings = {
  store_name?: string;
  store_meta_title?: string;
  store_meta_description?: string;
  store_phone?: string;
  logo?: string;
  favicon?: string;
  storefront_primary_menu?: string;
  storefront_categories_menu?: string;
  storefront_categories_top_menu?: string;
  storefront_more_menu?: string;
  storefront_desktop_categories_alignment?: 'left' | 'center';
  
  // Announcement Bar Settings
  announcement_enabled?: string; // "true" | "false"
  announcement_text?: string;
  announcement_bg_color?: string;
  announcement_text_color?: string;
  announcement_font_size?: string;
  announcement_font_family?: string;
  announcement_speed?: string;
  announcement_marquee?: string; // "true" | "false"
  announcement_sticky?: string; // "true" | "false"

  // WhatsApp Module
  whatsapp_phone?: string;
  whatsapp_product_enabled?: string; // "true" | "false"
  whatsapp_product_button_text?: string;
  whatsapp_product_message_template?: string;
  whatsapp_cart_enabled?: string; // "true" | "false"
  whatsapp_cart_button_text?: string;
  whatsapp_cart_message_template?: string;

  // Product detail settings
  storefront_show_stock_quantity?: string; // "1" | "0"

  support_center_cards?: string;
};

type StorefrontSettingsContextType = {
  settings: StorefrontSettings;
  loading: boolean;
  refresh: () => Promise<void>;
};

const StorefrontSettingsContext = createContext<StorefrontSettingsContextType | undefined>(undefined);

export function StorefrontSettingsProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: StorefrontSettings;
}) {
  const [settings, setSettings] = useState<StorefrontSettings>(initial || {});
  const [loading, setLoading] = useState(!initial);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<StorefrontSettings>("/api/storefront/settings");
      setSettings(data || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ settings, loading, refresh }), [settings, loading]);

  return (
    <StorefrontSettingsContext.Provider value={value}>
      {children}
    </StorefrontSettingsContext.Provider>
  );
}

export function useStorefrontSettings() {
  const ctx = useContext(StorefrontSettingsContext);
  if (!ctx) throw new Error("useStorefrontSettings must be used within StorefrontSettingsProvider");
  return ctx;
}
