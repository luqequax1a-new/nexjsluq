"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const backLabel = t("storefront.auth.back_to_store", "Mağazaya dön");

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <div className="relative min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden bg-[#bcd7ff] lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/auth/login-page-bg.png')" }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/30"
            aria-hidden="true"
          />
        </aside>

        <main className="relative flex min-h-screen items-start justify-center px-4 pb-8 pt-5 sm:px-6 sm:pt-7 lg:items-center lg:px-12 lg:py-16">
          <div className="absolute inset-0 bg-[#f7f9fc]" aria-hidden="true" />
          <div
            className="absolute inset-0 hidden bg-cover bg-center opacity-70 lg:block"
            style={{ backgroundImage: "url('/auth/top-mask.png')" }}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-[420px]">
            <div className="mb-4 flex">
              <Link
                href="/"
                aria-label={backLabel}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
              {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
            </div>

            <div className="mt-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.12)] sm:p-6 lg:mt-6 lg:rounded-[28px] lg:p-7 lg:shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
