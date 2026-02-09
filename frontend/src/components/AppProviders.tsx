"use client";

import { App, ConfigProvider, theme } from "antd";
import { useEffect } from "react";
import NProgress from "nprogress";
import { usePathname, useSearchParams } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";

function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({
      showSpinner: false,
      trickleSpeed: 50,
      minimum: 0.3,
      easing: "ease",
      speed: 200,
    });
  }, []);

  useEffect(() => {
    NProgress.start();
    const t = window.setTimeout(() => NProgress.done(), 250);
    return () => window.clearTimeout(t);
  }, [pathname, searchParams]);

  return null;
}

function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Service workers frequently cause stale `_next/static/*` caching issues during development.
    // In dev, ensure any existing registrations are removed.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {
          // ignore
        });

      // Best-effort cache cleanup (in case older SW versions used Cache API)
      const cachesAny: any = (globalThis as any).caches;
      if (cachesAny?.keys && cachesAny?.delete) {
        cachesAny
          .keys()
          .then((keys: string[]) => Promise.all(keys.map((k) => cachesAny.delete(k))))
          .catch(() => {
            // ignore
          });
      }

      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {
        // ignore
      });
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 2,
          controlHeight: 40,
          colorPrimary: "#5E5CE6",
          colorInfo: "#5E5CE6",
          fontFamily:
            "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
          colorBgContainer: "#ffffff",
          colorBorderSecondary: "#f0f0f0",
        },
        components: {
          Button: {
            controlHeight: 40,
            paddingContentHorizontal: 20,
            borderRadius: 2,
            fontWeight: 600,
          },
          Card: {
            borderRadiusLG: 2,
            boxShadowTertiary: "none",
          },
          Input: {
            borderRadius: 2,
            colorBorder: "#e2e8f0",
          },
          Select: {
            borderRadius: 2,
          },
          Table: {
            borderRadius: 0,
            headerBg: "#ffffff",
            headerColor: "#0f172a",
            headerSplitColor: "transparent",
            headerBorderRadius: 0,
          },
          Menu: {
            itemBorderRadius: 2,
            itemActiveBg: "#333333",
            itemSelectedBg: "#333333",
            itemSelectedColor: "#ffffff",
          },
        },
      }}
    >
      <App
        message={{ top: 80, duration: 3, maxCount: 3 }}
        notification={{ placement: 'topRight', duration: 4 }}
      >
        <AuthProvider>
          <RouteProgress />
          <ServiceWorkerRegister />
          {children}
        </AuthProvider>
      </App>
    </ConfigProvider>
  );
}
