"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export default function CouponCard({
  coupon,
  usedCount,
  remainingUsage,
}: {
  coupon: any;
  usedCount: number;
  remainingUsage: number | null;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const isPercent = coupon?.type === "percentage";
  const isFreeShipping = coupon?.type === "free_shipping";
  const valueText = isFreeShipping
    ? t("storefront.account.coupon.free_shipping", "Ücretsiz kargo")
    : isPercent
    ? `%${Number(coupon?.value || 0)}`
    : `${Number(coupon?.value || 0)} TRY`;

  const hasRemaining = remainingUsage === null || remainingUsage > 0;
  const isActive = Boolean(coupon?.is_active) && hasRemaining;

  const formatDate = (val: string | null) => {
    if (!val) return null;
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return val;
    return d.toLocaleDateString("tr-TR");
  };

  return (
    <div
      className={
        "rounded-2xl border overflow-hidden shadow-sm " +
        (isActive ? "border-indigo-200" : "border-slate-200 opacity-70")
      }
    >
      <div className={isActive ? "bg-gradient-to-r from-indigo-600 to-purple-500 text-white" : "bg-slate-200 text-slate-600"}>
        <div className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] opacity-80">
              {t("storefront.account.coupon.label", "Kupon")}
            </div>
            <div className="text-2xl font-extrabold mt-2">{valueText}</div>
          </div>
          <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            {isActive
              ? t("storefront.account.coupon.active", "Aktif")
              : t("storefront.account.coupon.inactive", "Pasif")}
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">{t("storefront.account.coupon.code", "Kod")}</span>
          <button
            type="button"
            onClick={async () => {
              if (!coupon?.code) return;
              try {
                await navigator.clipboard.writeText(String(coupon.code));
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                // ignore
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300"
          >
            {coupon?.code}
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">{t("storefront.account.coupon.name", "Ad")}</span>
          <span className="font-semibold text-slate-900">{coupon?.name}</span>
        </div>
        {coupon?.end_date ? (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t("storefront.account.coupon.expires", "Bitiş")}</span>
            <span className="font-semibold text-slate-900">{formatDate(coupon.end_date)}</span>
          </div>
        ) : null}
        {remainingUsage !== null ? (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              {t("storefront.account.coupon.remaining", "Kalan kullanım")}
            </span>
            <span className="font-semibold text-slate-900">
              {remainingUsage} / {coupon?.usage_limit_per_customer ?? 0}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              {t("storefront.account.coupon.usage", "Kullanım")}
            </span>
            <span className="font-semibold text-slate-900">
              {t("storefront.account.coupon.unlimited", "Sınırsız")}
            </span>
          </div>
        )}
        {usedCount > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              {t("storefront.account.coupon.used", "Kullanıldı")}
            </span>
            <span className="font-semibold text-slate-900">{usedCount}</span>
          </div>
        ) : null}
        {copied ? (
          <div className="text-xs text-emerald-600">
            {t("storefront.account.coupon.copied", "Kopyalandı")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
