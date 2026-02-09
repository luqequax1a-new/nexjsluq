"use client";

import React, { useState } from "react";
import { useI18n } from "@/context/I18nContext";
import type { GuestOrderTrackingPayload } from "@/lib/api/storefrontOrders";
import { Hash, Mail } from "lucide-react";

type GuestOrderTrackingFormProps = {
  loading?: boolean;
  error?: string | null;
  onSubmit: (payload: GuestOrderTrackingPayload) => Promise<void>;
};

export default function GuestOrderTrackingForm({
  loading,
  error,
  onSubmit,
}: GuestOrderTrackingFormProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<GuestOrderTrackingPayload>({
    order_number: "",
    email: "",
  });

  const update = (key: keyof GuestOrderTrackingPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      order_number: form.order_number.trim(),
      email: form.email.trim(),
    });
  };

  const isDisabled = loading || !form.order_number.trim() || !form.email.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          {t("storefront.order_tracking.order_number", "Siparis Numarasi")}
        </label>
        <div className="relative">
          <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            required
            value={form.order_number}
            onChange={(e) => update("order_number", e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            placeholder="SIP-2026-00001"
            autoComplete="off"
          />
        </div>
        <p className="text-xs text-slate-500">Ornek: SIP-2026-00001 veya #1254</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          {t("storefront.order_tracking.email", "E-posta")}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            placeholder="ornek@eposta.com"
            autoComplete="email"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {t("storefront.order_tracking.searching", "Sorgulaniyor...")}
          </>
        ) : (
          t("storefront.order_tracking.search", "Siparisi Sorgula")
        )}
      </button>
    </form>
  );
}
