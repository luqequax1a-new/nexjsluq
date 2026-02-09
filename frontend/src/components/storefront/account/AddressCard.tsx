"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Building2, Pencil, Trash2 } from "lucide-react";
import type { CustomerAddress } from "@/types/order";
import { useI18n } from "@/context/I18nContext";

export default function AddressCard({
  address,
  variant,
  isDefault,
  onMakeDefault,
  onDelete,
  editHref,
}: {
  address: CustomerAddress;
  variant: "shipping" | "billing";
  isDefault: boolean;
  onMakeDefault: (id: number) => void;
  onDelete: (id: number) => void;
  editHref: string;
}) {
  const { t } = useI18n();
  const badgeLabel =
    variant === "shipping"
      ? t("storefront.account.address.default_shipping", "Varsayılan teslimat")
      : t("storefront.account.address.default_billing", "Varsayılan fatura");

  return (
    <div
      className={
        "relative rounded-2xl border p-5 shadow-sm transition " +
        (isDefault
          ? "border-indigo-200 bg-indigo-50/40"
          : "border-slate-200 bg-white hover:border-slate-300")
      }
    >
      {isDefault ? (
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-600">
          <CheckCircle2 className="h-4 w-4" />
          {badgeLabel}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {address.title || t("storefront.account.address.fallback_title", "Adres")}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {address.first_name} {address.last_name}
          </div>
        </div>
        {address.type === "corporate" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            <Building2 className="h-3.5 w-3.5" />
            {t("storefront.account.address.corporate", "Kurumsal")}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-1 text-sm text-slate-600">
        <div>{address.address_line_1}</div>
        <div>
          {address.state ? `${address.state} / ` : ""}
          {address.city}
        </div>
        {address.phone ? <div>{address.phone}</div> : null}
        {variant === "billing" && address.company ? (
          <div className="text-xs text-slate-500">
            {address.company}
            {address.tax_number
              ? ` | ${t("storefront.account.address.tax_number", "Vergi No")}: ${address.tax_number}`
              : ""}
            {address.tax_office
              ? ` | ${t("storefront.account.address.tax_office", "Vergi Dairesi")}: ${address.tax_office}`
              : ""}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {!isDefault ? (
          <button
            type="button"
            onClick={() => onMakeDefault(address.id)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
          >
            {t("storefront.account.address.make_default", "Varsayılan yap")}
          </button>
        ) : null}
        <Link
          href={editHref}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t("storefront.account.address.edit", "Düzenle")}
        </Link>
        <button
          type="button"
          onClick={() => onDelete(address.id)}
          className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("storefront.account.address.delete", "Sil")}
        </button>
      </div>
    </div>
  );
}
