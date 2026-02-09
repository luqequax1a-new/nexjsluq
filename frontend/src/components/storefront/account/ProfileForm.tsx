"use client";

import React, { useEffect, useState } from "react";
import { getCustomerProfile, updateCustomerProfile } from "@/lib/api/storefrontAccount";
import type { Customer } from "@/types/order";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useI18n } from "@/context/I18nContext";

export default function ProfileForm() {
  const { refresh } = useCustomerAuth();
  const { t } = useI18n();
  const [profile, setProfile] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getCustomerProfile();
        if (!mounted) return;
        setProfile(res.customer);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-slate-500">
        {t("storefront.account.profile.loading", "Profil yükleniyor...")}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-sm text-slate-500">
        {t("storefront.account.profile.not_found", "Profil bulunamadı.")}
      </div>
    );
  }

  const updateField = (key: keyof Customer, value: string | boolean) => {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updatePassword = (key: keyof typeof passwords, value: string) => {
    setPasswords((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    if (!profile.first_name || !profile.last_name || !profile.email) {
      setSaving(false);
      setError(t("storefront.account.profile.required_error", "Lütfen zorunlu alanları doldurun."));
      return;
    }
    const wantsPasswordChange = Boolean(passwords.password || passwords.password_confirmation || passwords.current_password);
    if (wantsPasswordChange) {
      if (!passwords.current_password) {
        setSaving(false);
        setError(t("storefront.account.profile.current_password_required", "Mevcut şifrenizi giriniz."));
        return;
      }
      if (passwords.password !== passwords.password_confirmation) {
        setSaving(false);
        setError(t("storefront.account.profile.password_mismatch", "Şifreler eşleşmiyor."));
        return;
      }
    }
    try {
      await updateCustomerProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone || undefined,
        accepts_marketing: profile.accepts_marketing,
        current_password: passwords.current_password || undefined,
        password: passwords.password || undefined,
        password_confirmation: passwords.password_confirmation || undefined,
      });
      await refresh();
      setMessage(t("storefront.account.profile.updated", "Profil güncellendi."));
      setPasswords({ current_password: "", password: "", password_confirmation: "" });
    } catch (err: any) {
      setError(err?.message || t("storefront.account.profile.update_failed", "Güncelleme başarısız."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {t("storefront.account.profile.first_name", "Ad")}
          </label>
          <input
            value={profile.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
            className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {t("storefront.account.profile.last_name", "Soyad")}
          </label>
          <input
            value={profile.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
            className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">
          {t("storefront.account.profile.email", "E-posta")}
        </label>
        <input
          type="email"
          value={profile.email}
          onChange={(e) => updateField("email", e.target.value)}
          className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">
          {t("storefront.account.profile.phone", "Telefon")}
        </label>
        <input
          value={profile.phone || ""}
          onChange={(e) => updateField("phone", e.target.value)}
          className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={profile.accepts_marketing}
          onChange={(e) => updateField("accepts_marketing", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        {t("storefront.account.profile.accepts_marketing", "Kampanya ve duyuruları almak istiyorum")}
      </label>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
        <div className="text-sm font-semibold text-slate-900">
          {t("storefront.account.profile.change_password", "Şifre değiştir")}
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {t("storefront.account.profile.current_password", "Mevcut şifre")}
          </label>
          <input
            type="password"
            value={passwords.current_password}
            onChange={(e) => updatePassword("current_password", e.target.value)}
            className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              {t("storefront.account.profile.new_password", "Yeni şifre")}
            </label>
            <input
              type="password"
              value={passwords.password}
              onChange={(e) => updatePassword("password", e.target.value)}
              className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              {t("storefront.account.profile.password_confirm", "Yeni şifre (tekrar)")}
            </label>
            <input
              type="password"
              value={passwords.password_confirmation}
              onChange={(e) => updatePassword("password_confirmation", e.target.value)}
              className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold hover:bg-black transition disabled:opacity-60"
      >
        {saving
          ? t("storefront.account.profile.saving", "Kaydediliyor...")
          : t("storefront.account.profile.save", "Profili kaydet")}
      </button>
    </form>
  );
}
