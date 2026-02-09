"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { customerApiFetch } from "@/lib/api";
import { getAuthErrorMessage } from "./auth-helpers";
import { useI18n } from "@/context/I18nContext";

export default function ForgotPasswordForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const res = await customerApiFetch<{ message?: string }>("/api/storefront/auth/forgot-password", {
        method: "POST",
        json: { email },
      });
      setStatus(res?.message || t("storefront.auth.reset_link_sent", "Şifre sıfırlama bağlantısı gönderildi."));
    } catch (err) {
      setError(getAuthErrorMessage(err, t("storefront.auth.request_failed", "İstek başarısız.")));
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

      <fieldset disabled={loading} className="space-y-4 disabled:cursor-not-allowed disabled:opacity-80">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {t("storefront.auth.email", "E-posta")}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 h-12 w-full rounded-none border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
            placeholder={t("storefront.auth.email_placeholder", "ornek@eposta.com")}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-base font-semibold text-white transition hover:bg-black disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("storefront.auth.sending", "Gönderiliyor...")}</span>
            </>
          ) : (
            t("storefront.auth.send_reset_link", "Sıfırlama linki gönder")
          )}
        </button>

        <div className="text-sm text-slate-500">
          {t("storefront.auth.remembered_password", "Şifreni hatırladın mı?")}{" "}
          <Link href="/giris" className="font-semibold text-indigo-600 hover:text-indigo-700">
            {t("storefront.auth.back_to_login", "Girişe dön")}
          </Link>
        </div>
      </fieldset>
    </form>
  );
}
