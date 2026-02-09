"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { getAuthErrorMessage } from "./auth-helpers";
import { useI18n } from "@/context/I18nContext";
import AuthLoadingOverlay from "./AuthLoadingOverlay";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useCustomerAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      const next = searchParams.get("next") || "/hesap";
      router.replace(next);
    } catch (err) {
      setError(getAuthErrorMessage(err, t("storefront.auth.login_failed", "Giriş başarısız.")));
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

          <div>
            <label className="text-sm font-semibold text-slate-700">
              {t("storefront.auth.password", "Şifre")}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 w-full rounded-none border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
              placeholder="********"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link href="/sifremi-unuttum" className="font-semibold text-indigo-600 hover:text-indigo-700">
              {t("storefront.auth.forgot_password", "Şifremi unuttum")}
            </Link>
            <Link href="/kayit" className="text-slate-500 hover:text-slate-700">
              {t("storefront.auth.create_account", "Hesap oluştur")}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-base font-semibold text-white transition hover:bg-black disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("storefront.auth.signing_in", "Giriş yapılıyor...")}</span>
              </>
            ) : (
              t("storefront.auth.sign_in", "Giriş yap")
            )}
          </button>
        </fieldset>
      </form>

      <AuthLoadingOverlay
        visible={loading}
        message={t("storefront.auth.signing_in", "Giriş yapılıyor...")}
      />
    </>
  );
}
