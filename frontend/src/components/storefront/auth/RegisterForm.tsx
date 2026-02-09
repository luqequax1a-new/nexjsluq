"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { getAuthErrorMessage } from "./auth-helpers";
import { useI18n } from "@/context/I18nContext";
import AuthLoadingOverlay from "./AuthLoadingOverlay";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useCustomerAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    accepts_marketing: false,
  });

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const sanitizeTrPhone = (value: unknown) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    const noLeadingZero = digits.replace(/^0+/, "");
    return noLeadingZero.slice(0, 10);
  };

  const normalizeTrPhone = (value: string) => {
    const digits = sanitizeTrPhone(value);
    return digits ? `+90${digits}` : "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const phone = normalizeTrPhone(form.phone);

      await register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: phone || undefined,
        password: form.password,
        password_confirmation: form.password_confirmation,
        accepts_marketing: form.accepts_marketing,
      });

      const next = searchParams.get("next") || "/hesap";
      router.replace(next);
    } catch (err) {
      setError(getAuthErrorMessage(err, t("storefront.auth.register_failed", "Kayıt başarısız.")));
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <fieldset disabled={loading} className="space-y-4 disabled:cursor-not-allowed disabled:opacity-80">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                {t("storefront.auth.first_name", "Ad")}
              </label>
              <input
                required
                value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
                className="mt-2 h-12 w-full rounded-none border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                {t("storefront.auth.last_name", "Soyad")}
              </label>
              <input
                required
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
                className="mt-2 h-12 w-full rounded-none border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              {t("storefront.auth.email", "E-posta")}
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="mt-2 h-12 w-full rounded-none border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              {t("storefront.auth.phone", "Telefon")}
            </label>
            <div className="mt-2 flex w-full">
              <input
                value="+90"
                readOnly
                tabIndex={-1}
                className="h-12 w-16 rounded-none border border-slate-200 bg-slate-50 text-center text-sm text-slate-600"
              />
              <input
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(e) => update("phone", sanitizeTrPhone(e.target.value))}
                className="h-12 flex-1 rounded-none border border-l-0 border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
                placeholder="5XXXXXXXXX"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              {t("storefront.auth.password", "Şifre")}
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="mt-2 h-12 w-full rounded-none border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              {t("storefront.auth.password_confirm", "Şifre (tekrar)")}
            </label>
            <input
              type="password"
              required
              value={form.password_confirmation}
              onChange={(e) => update("password_confirmation", e.target.value)}
              className="mt-2 h-12 w-full rounded-none border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.accepts_marketing}
              onChange={(e) => update("accepts_marketing", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {t("storefront.auth.accepts_marketing", "Kampanya ve güncellemeleri almak istiyorum")}
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-base font-semibold text-white transition hover:bg-black disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("storefront.auth.creating_account", "Hesap oluşturuluyor...")}</span>
              </>
            ) : (
              t("storefront.auth.create_account", "Hesap oluştur")
            )}
          </button>

          <div className="text-sm text-slate-500">
            {t("storefront.auth.have_account", "Zaten hesabın var mı?")}{" "}
            <Link href="/giris" className="font-semibold text-indigo-600 hover:text-indigo-700">
              {t("storefront.auth.sign_in", "Giriş yap")}
            </Link>
          </div>
        </fieldset>
      </form>

      <AuthLoadingOverlay
        visible={loading}
        message={t("storefront.auth.creating_account", "Hesap oluşturuluyor...")}
      />
    </>
  );
}
