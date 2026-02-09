"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { setGlobalTranslations, translate, Dict } from "@/lib/i18n";
import { Spin, Typography } from "antd";

const { Text } = Typography;

interface I18nContextType {
  loading: boolean;
  locale: string;
  dict: Dict;
  t: (key: string, fallback?: string) => string;
  refresh: () => Promise<void>;
  switchLocale: (newLocale: string) => Promise<void>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);
const LOCALE_COOKIE_KEY = "app_locale";
const DICT_CACHE_PREFIX = "i18n_dict_";

function readCookieLocale(): string {
  if (typeof document === "undefined") return "tr";
  return document.cookie.match(/app_locale=([^;]+)/)?.[1] || "tr";
}

function getCacheKey(locale: string): string {
  return `${DICT_CACHE_PREFIX}${locale}`;
}

function readCachedDict(locale: string): Dict | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getCacheKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Dict;
    return null;
  } catch {
    return null;
  }
}

function writeCachedDict(locale: string, dict: Dict): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getCacheKey(locale), JSON.stringify(dict));
  } catch {
    // Ignore quota/storage errors.
  }
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Unknown translation error";
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState("tr");
  const [dict, setDict] = useState<Dict>({});
  const [mounted, setMounted] = useState(false);

  const applyLocaleMeta = useCallback((activeLocale: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${LOCALE_COOKIE_KEY}=${activeLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    document.documentElement.setAttribute("lang", activeLocale);
  }, []);

  const applyDict = useCallback((nextDict: Dict) => {
    setDict(nextDict);
    setGlobalTranslations(nextDict);
  }, []);

  const loadTranslations = useCallback(
    async (targetLocale?: string) => {
      const activeLocale = targetLocale || initialLocale || readCookieLocale();
      setLocale(activeLocale);
      applyLocaleMeta(activeLocale);

      try {
        const data = await apiFetch<Dict>(`/api/translations/${activeLocale}?v=${Date.now()}`, {
          auth: "none",
        });

        applyDict(data || {});
        writeCachedDict(activeLocale, data || {});
      } catch (error) {
        const cached = readCachedDict(activeLocale);
        if (cached) {
          applyDict(cached);
        } else {
          applyDict({});
        }

        // Keep this as warn in dev to avoid React Dev Overlay false-positives.
        // Root cause is usually backend/db not reachable.
        console.warn("Failed to load translations:", getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [applyDict, applyLocaleMeta, initialLocale]
  );

  const t = useCallback(
    (key: string, fallback?: string) => {
      return translate(dict, key, fallback);
    },
    [dict]
  );

  const switchLocale = async (newLocale: string) => {
    setLoading(true);
    await loadTranslations(newLocale);
  };

  useEffect(() => {
    setMounted(true);
    void loadTranslations(initialLocale);
  }, [initialLocale, loadTranslations]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          gap: 16,
        }}
      >
        <Spin size="large" />
        <Text type="secondary" style={{ fontSize: 13 }}>
          Yukleniyor...
        </Text>
      </div>
    );
  }

  return (
    <I18nContext.Provider
      value={{ loading, locale, dict, t, refresh: () => loadTranslations(), switchLocale }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
