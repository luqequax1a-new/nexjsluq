"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleHelp, Clock3, PackageSearch, ShieldCheck } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import OrderDetail from "@/components/storefront/account/OrderDetail";
import GuestOrderTrackingForm from "@/components/storefront/order-tracking/GuestOrderTrackingForm";
import { trackGuestOrder, type GuestOrderTrackingPayload } from "@/lib/api/storefrontOrders";
import type { Order } from "@/types/order";

export default function GuestOrderTrackingPanel() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  const getErrorMessage = (err: unknown) => {
    if (typeof err === "object" && err !== null && "message" in err) {
      const message = (err as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    return t("storefront.order_tracking.not_found", "Siparis bulunamadi. E-posta ve siparis no kontrol edin.");
  };

  const handleSearch = async (payload: GuestOrderTrackingPayload) => {
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await trackGuestOrder(payload);
      setOrder(response.order);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!order || loading) return;
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [order, loading]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <section className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-5 py-7 text-white shadow-2xl sm:px-8 sm:py-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
                <PackageSearch className="h-3.5 w-3.5" />
                Siparis Takip Merkezi
              </p>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                {t("storefront.order_tracking.title", "Siparis Takibi")}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-200 sm:text-base">
                {t(
                  "storefront.order_tracking.subtitle",
                  "Misafir siparisinizi e-posta ve siparis numarasi ile sorgulayabilirsiniz."
                )}
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[320px]">
              <div className="border border-white/20 bg-white/10 p-3">
                <div className="text-xs font-semibold text-slate-200">Takip</div>
                <div className="mt-1 text-sm font-bold text-white">Anlik durum</div>
              </div>
              <div className="border border-white/20 bg-white/10 p-3">
                <div className="text-xs font-semibold text-slate-200">Guvenlik</div>
                <div className="mt-1 text-sm font-bold text-white">E-posta dogrulama</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Siparis sorgula</h2>
                <p className="mt-1 text-sm text-slate-500">Siparis numarasi ve e-posta ile devam edin.</p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-600">
                <PackageSearch className="h-5 w-5" />
              </span>
            </div>
            <GuestOrderTrackingForm loading={loading} error={error} onSubmit={handleSearch} />
          </div>

          <aside className="space-y-4">
            <div className="border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Nasil calisir?</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 border border-slate-200 bg-slate-50 p-1.5 text-slate-600">
                    <CircleHelp className="h-3.5 w-3.5" />
                  </span>
                  Siparis numarasi ve e-posta bilgisini girin.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 border border-slate-200 bg-slate-50 p-1.5 text-slate-600">
                    <Clock3 className="h-3.5 w-3.5" />
                  </span>
                  Durum, odeme ve teslimat adimlarini aninda gorun.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 border border-slate-200 bg-slate-50 p-1.5 text-slate-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  Verileriniz sadece ilgili siparisle eslesirse gosterilir.
                </li>
              </ul>
            </div>

            <div className="border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Hizli erisim</h3>
              <p className="mt-2 text-sm text-slate-600">Hesap sahibiyseniz tum siparisleri tek panelden yonetebilirsiniz.</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/giris"
                  className="inline-flex items-center justify-center border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Hesabima giris yap
                </Link>
                <Link
                  href="/hesap/siparisler"
                  className="inline-flex items-center justify-center bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Hesabim siparisleri
                </Link>
              </div>
            </div>
          </aside>
        </section>

        {order ? (
          <section ref={resultRef} className="mt-8 scroll-mt-24">
            <div className="border border-slate-200 bg-white shadow-sm">
              <OrderDetail order={order} />
            </div>
          </section>
        ) : (
          <section className="mt-8 border border-dashed border-slate-300 bg-white/80 p-7 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center border border-slate-200 bg-slate-50 text-slate-600">
              <PackageSearch className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">Sorgu sonucu burada gosterilir</h3>
            <p className="mt-1 text-sm text-slate-500">
              Siparisinizi sorguladiginizda durum ve urun detaylari bu alana otomatik gelir.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
