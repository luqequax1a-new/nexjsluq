"use client";

import React, { useMemo, useState } from "react";
import type { CustomerAddress } from "@/types/order";
import { TURKEY_PROVINCES, TURKEY_DISTRICTS } from "@/lib/turkey-locations";
import { useI18n } from "@/context/I18nContext";

type AddressFormState = {
  title: string;
  first_name: string;
  last_name: string;
  type: "individual" | "corporate";
  phone: string;
  company: string;
  tax_number: string;
  tax_office: string;
  address_line_1: string;
  city: string;
  state: string;
  country: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
};

const emptyState: AddressFormState = {
  title: "",
  first_name: "",
  last_name: "",
  type: "individual",
  phone: "",
  company: "",
  tax_number: "",
  tax_office: "",
  address_line_1: "",
  city: "",
  state: "",
  country: "TR",
  is_default_shipping: false,
  is_default_billing: false,
};

const sanitizeTrPhone = (value: unknown) => {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length > 10) {
    digits = digits.slice(2);
  }
  const noLeadingZero = digits.replace(/^0+/, "");
  return noLeadingZero.slice(0, 10);
};

const normalizeTrPhone = (value: unknown) => {
  const digits = sanitizeTrPhone(value);
  return digits ? `+90${digits}` : "";
};

export default function AddressForm({
  variant,
  initial,
  onSubmit,
  submitting,
}: {
  variant: "shipping" | "billing";
  initial?: Partial<CustomerAddress>;
  submitting?: boolean;
  onSubmit: (payload: Partial<CustomerAddress>) => Promise<void>;
}) {
  const { t } = useI18n();
  const initialState = useMemo(() => {
    if (!initial) return emptyState;
    return {
      ...emptyState,
      title: initial.title || "",
      first_name: initial.first_name || "",
      last_name: initial.last_name || "",
      type: (initial.type as "individual" | "corporate") || "individual",
      phone: sanitizeTrPhone(initial.phone || ""),
      company: initial.company || "",
      tax_number: initial.tax_number || "",
      tax_office: initial.tax_office || "",
      address_line_1: initial.address_line_1 || "",
      city: initial.city || "",
      state: initial.state || "",
      country: initial.country || "TR",
      is_default_shipping: Boolean(initial.is_default_shipping),
      is_default_billing: Boolean(initial.is_default_billing),
    } as AddressFormState;
  }, [initial]);

  const [form, setForm] = useState<AddressFormState>(initialState);
  const [error, setError] = useState<string | null>(null);

  const districts = form.city ? (TURKEY_DISTRICTS as Record<string, string[]>)[form.city] || [] : [];

  const update = (key: keyof AddressFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const phoneDigits = sanitizeTrPhone(form.phone);

    if (!form.first_name || !form.last_name || !form.address_line_1 || !form.city || !phoneDigits) {
      setError(t("storefront.account.address.required_error", "Lütfen zorunlu alanları doldurun."));
      return;
    }

    if (phoneDigits.length !== 10) {
      setError(t("storefront.account.address.phone_invalid", "Telefon numarasi 10 haneli olmalidir."));
      return;
    }

    await onSubmit({
      title: form.title || null,
      first_name: form.first_name,
      last_name: form.last_name,
      type: form.type,
      phone: normalizeTrPhone(phoneDigits) || null,
      company: form.company || null,
      tax_number: form.tax_number || null,
      tax_office: form.tax_office || null,
      address_line_1: form.address_line_1,
      city: form.city,
      state: form.state || null,
      country: form.country || "TR",
      is_default_shipping: form.is_default_shipping,
      is_default_billing: form.is_default_billing,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {t("storefront.account.address.title", "Adres başlığı")}
          </label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
            placeholder={t("storefront.account.address.title_placeholder", "Ev, İş")}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {t("storefront.account.address.phone", "Telefon")}
          </label>
          <div className="mt-2 flex w-full">
            <input
              value="+90"
              readOnly
              tabIndex={-1}
              className="h-11 w-16 rounded-l-xl border border-slate-200 bg-slate-50 text-center text-sm text-slate-600"
            />
            <input
              required
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={(e) => update("phone", sanitizeTrPhone(e.target.value))}
              className="h-11 flex-1 rounded-r-xl border border-l-0 border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
              placeholder="5XXXXXXXXX"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {t("storefront.account.address.first_name", "Ad")}
          </label>
          <input
            required
            value={form.first_name}
            onChange={(e) => update("first_name", e.target.value)}
            className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {t("storefront.account.address.last_name", "Soyad")}
          </label>
          <input
            required
            value={form.last_name}
            onChange={(e) => update("last_name", e.target.value)}
            className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {variant === "billing" ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              {t("storefront.account.address.billing_type", "Fatura tipi")}
            </label>
            <div className="mt-2 inline-flex rounded-xl border border-slate-200 bg-white p-1">
              {(["individual", "corporate"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => update("type", opt)}
                  className={
                    "px-4 py-2 text-sm font-semibold rounded-lg transition " +
                    (form.type === opt ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900")
                  }
                >
                  {opt === "individual"
                    ? t("storefront.account.address.billing_individual", "Bireysel")
                    : t("storefront.account.address.billing_corporate", "Kurumsal")}
                </button>
              ))}
            </div>
          </div>

          {form.type === "corporate" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  {t("storefront.account.address.company", "Firma adı")}
                </label>
                <input
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  {t("storefront.account.address.tax_office", "Vergi dairesi")}
                </label>
                <input
                  value={form.tax_office}
                  onChange={(e) => update("tax_office", e.target.value)}
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  {t("storefront.account.address.tax_number", "Vergi No")}
                </label>
                <input
                  value={form.tax_number}
                  onChange={(e) => update("tax_number", e.target.value)}
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-semibold text-slate-700">
                {t("storefront.account.address.national_id", "T.C. Kimlik No (opsiyonel)")}
              </label>
              <input
                value={form.tax_number}
                onChange={(e) => update("tax_number", e.target.value)}
                className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          )}
        </div>
      ) : null}

      <div>
        <label className="text-sm font-semibold text-slate-700">
          {t("storefront.account.address.line1", "Adres")}
        </label>
        <input
          required
          value={form.address_line_1}
          onChange={(e) => update("address_line_1", e.target.value)}
          className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {t("storefront.account.address.city", "İl")}
          </label>
          <select
            required
            value={form.city}
            onChange={(e) => {
              update("city", e.target.value);
              update("state", "");
            }}
            className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
          >
            <option value="">{t("storefront.account.address.select", "Seçiniz")}</option>
            {TURKEY_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {t("storefront.account.address.district", "İlçe")}
          </label>
          <select
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
            disabled={!form.city}
          >
            <option value="">{t("storefront.account.address.select", "Seçiniz")}</option>
            {districts.map((d: string) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {variant === "shipping" ? (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.is_default_shipping}
              onChange={(e) => update("is_default_shipping", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {t("storefront.account.address.set_default_shipping", "Varsayılan teslimat adresi yap")}
          </label>
        ) : null}
        {variant === "billing" ? (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.is_default_billing}
              onChange={(e) => update("is_default_billing", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {t("storefront.account.address.set_default_billing", "Varsayılan fatura adresi yap")}
          </label>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold hover:bg-black transition disabled:opacity-60"
      >
        {submitting
          ? t("storefront.account.address.saving", "Kaydediliyor...")
          : t("storefront.account.address.save", "Adresi kaydet")}
      </button>
    </form>
  );
}
