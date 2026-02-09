"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { HeaderIcons } from "@/components/storefront/header/HeaderIcons";
import { useStorefrontSettings } from "@/context/StorefrontSettingsContext";
import { normalizePhone } from "@/lib/whatsapp";

type SupportCardType = "whatsapp" | "phone" | "order_tracking";

type SupportCardConfig = {
  type: SupportCardType;
  title?: string;
  subtitle?: string;
  enabled?: boolean;
};

export default function SupportCenterModal({
  open,
  onClose,
  phone,
  whatsappHref,
  orderTrackingHref = "/siparis-takibi",
}: {
  open: boolean;
  onClose: () => void;
  phone?: string;
  whatsappHref?: string;
  orderTrackingHref?: string;
}) {
  const { settings } = useStorefrontSettings();
  const fallbackPhone = "905456555466";
  const resolvedPhone = String(phone || settings.whatsapp_phone || settings.store_phone || fallbackPhone).trim();
  const resolvedWhatsappHref =
    whatsappHref || (resolvedPhone ? `https://wa.me/${normalizePhone(resolvedPhone)}` : "");

  const cards = React.useMemo<SupportCardConfig[]>(() => {
    const defaults: SupportCardConfig[] = [
      {
        type: "whatsapp",
        enabled: true,
        title: "WhatsApp Desteği",
        subtitle: "Size yardımcı olmaktan mutluluk duyarız",
      },
      {
        type: "phone",
        enabled: true,
        title: "Bizi Arayın",
        subtitle: resolvedPhone,
      },
      {
        type: "order_tracking",
        enabled: true,
        title: "Sipariş Takibi",
        subtitle: "Siparişinizin durumunu öğrenin",
      },
    ];

    const raw = (settings as any)?.support_center_cards;
    if (!raw || typeof raw !== "string") return defaults;

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return defaults;

      const normalized = parsed
        .filter(Boolean)
        .map((x: any) => ({
          type: String(x?.type || "") as SupportCardType,
          title: typeof x?.title === "string" ? x.title : undefined,
          subtitle: typeof x?.subtitle === "string" ? x.subtitle : undefined,
          enabled: x?.enabled === undefined ? undefined : !!x.enabled,
        }))
        .filter((x: SupportCardConfig) => x.type === "whatsapp" || x.type === "phone" || x.type === "order_tracking");

      if (!normalized.length) return defaults;

      return normalized.map((c) => {
        const d = defaults.find((x) => x.type === c.type);
        return {
          type: c.type,
          enabled: c.enabled ?? d?.enabled ?? true,
          title: (c.title ?? d?.title) || "",
          subtitle:
            c.type === "phone"
              ? ((c.subtitle ?? d?.subtitle) || resolvedPhone)
              : ((c.subtitle ?? d?.subtitle) || ""),
        };
      });
    } catch {
      return defaults;
    }
  }, [settings, resolvedPhone]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className={cn("fixed inset-0 z-[160] lg:hidden", open ? "visible" : "invisible pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <div className={cn("absolute inset-x-0 bottom-0 transition-transform duration-200 ease-out", open ? "translate-y-0" : "translate-y-full")}>
        <div className="mx-auto w-full max-w-[520px] rounded-t-3xl bg-white shadow-2xl overflow-hidden">
          <div className="h-[64px] px-5 flex items-center justify-between border-b border-gray-100">
            <div className="text-[18px] font-extrabold text-[#0e1e3e] font-heading">Destek Merkezi</div>
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center focus:outline-none focus-visible:outline-none"
              onClick={onClose}
              aria-label="Kapat"
            >
              <HeaderIcons.Close className="text-gray-700" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {cards.some((c) => c.type === "whatsapp" && c.enabled !== false) && resolvedWhatsappHref ? (
              <a
                href={resolvedWhatsappHref}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors"
                onClick={onClose}
              >
                <div className="px-4 py-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <HeaderIcons.WhatsApp className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-[#0e1e3e]">{cards.find((c) => c.type === "whatsapp")?.title || "WhatsApp Desteği"}</div>
                    <div className="text-[12px] text-gray-500 truncate">{cards.find((c) => c.type === "whatsapp")?.subtitle || "Size yardımcı olmaktan mutluluk duyarız"}</div>
                  </div>
                  <HeaderIcons.ChevronRight className="text-gray-400" />
                </div>
              </a>
            ) : null}

            {cards.some((c) => c.type === "phone" && c.enabled !== false) && resolvedPhone ? (
              <a
                href={`tel:${resolvedPhone}`}
                className="block rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors"
                onClick={onClose}
              >
                <div className="px-4 py-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <HeaderIcons.Phone className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-[#0e1e3e]">{cards.find((c) => c.type === "phone")?.title || "Bizi Arayın"}</div>
                    <div className="text-[12px] text-gray-500 truncate">{cards.find((c) => c.type === "phone")?.subtitle || resolvedPhone}</div>
                  </div>
                  <HeaderIcons.ChevronRight className="text-gray-400" />
                </div>
              </a>
            ) : null}

            {cards.some((c) => c.type === "order_tracking" && c.enabled !== false) ? (
              <Link
                href={orderTrackingHref}
                className="block rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors"
                onClick={onClose}
              >
                <div className="px-4 py-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                    <HeaderIcons.Box className="text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-[#0e1e3e]">{cards.find((c) => c.type === "order_tracking")?.title || "Sipariş Takibi"}</div>
                    <div className="text-[12px] text-gray-500 truncate">{cards.find((c) => c.type === "order_tracking")?.subtitle || "Siparişinizin durumunu öğrenin"}</div>
                  </div>
                  <HeaderIcons.ChevronRight className="text-gray-400" />
                </div>
              </Link>
            ) : null}
          </div>

          <div className="h-6 flex items-center justify-center">
            <div className="w-12 h-1.5 rounded-full bg-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
