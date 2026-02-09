"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { customerApiFetch } from "@/lib/api";
import { getAuthErrorMessage } from "./auth-helpers";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useI18n } from "@/context/I18nContext";

export default function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const { login } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailPrefill = searchParams.get("email") || "";
  const [form, setForm] = useState({
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!form.email && emailPrefill) {
      setForm((prev) => ({ ...prev, email: emailPrefill }));
    }
  }, [emailPrefill, form.email]);

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await customerApiFetch<{ message?: string }>("/api/storefront/auth/reset-password", {
        method: "POST",
        json: {
          token,
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
        },
      });
      // Auto login after successful reset
      try {
        await login(form.email, form.password);
        router.replace("/hesap");
        return;
      } catch {
        // fallback to status message
      }
      setStatus(
        res?.message ||
          t("storefront.auth.password_updated", "Şifre güncellendi. Giriş yapabilirsiniz.")
      );
    } catch (err) {
      setError(getAuthErrorMessage(err, t("storefront.auth.reset_failed", "Sıfırlama başarısız.")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {status ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {status}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <label className="text-sm font-semibold text-slate-700">
          {t("storefront.auth.email", "E-posta")}
        </label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className="mt-2 w-full h-12 rounded-none border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
          placeholder={t("storefront.auth.email_placeholder", "ornek@eposta.com")}
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">
          {t("storefront.auth.new_password", "Yeni şifre")}
        </label>
        <input
          type="password"
          required
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          className="mt-2 w-full h-12 rounded-none border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
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
          className="mt-2 w-full h-12 rounded-none border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold hover:bg-black transition disabled:opacity-60"
      >
        {loading
          ? t("storefront.auth.updating_password", "Güncelleniyor...")
          : t("storefront.auth.update_password", "Şifreyi güncelle")}
      </button>

      <div className="text-sm text-slate-500">
        <Link href="/giris" className="text-indigo-600 font-semibold hover:text-indigo-700">
          {t("storefront.auth.back_to_login", "Girişe dön")}
        </Link>
      </div>
    </form>
  );
}
