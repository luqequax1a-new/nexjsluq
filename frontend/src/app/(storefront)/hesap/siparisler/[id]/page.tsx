"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AccountShell from "@/components/storefront/account/AccountShell";
import OrderDetail from "@/components/storefront/account/OrderDetail";
import { getCustomerOrder } from "@/lib/api/storefrontAccount";
import type { Order } from "@/types/order";
import { useI18n } from "@/context/I18nContext";

export default function OrderDetailPage() {
  const params = useParams();
  const { t } = useI18n();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? Number(rawId) : Array.isArray(rawId) ? Number(rawId[0]) : NaN;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError(t("storefront.account.orders.not_found", "Sipariş bulunamadı."));
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await getCustomerOrder(id);
        if (!mounted) return;
        setOrder(res.order);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || t("storefront.account.orders.load_failed", "Sipariş yüklenemedi."));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <AccountShell
      title={t("storefront.account.orders.detail_title", "Sipariş detayı")}
      subtitle={
        order
          ? `${t("storefront.account.orders.order_label", "Sipariş")} #${order.order_number}`
          : t("storefront.account.orders.detail_subtitle", "Sipariş detaylarını inceleyin.")
      }
    >
      {loading ? (
        <div className="text-sm text-slate-500">
          {t("storefront.account.orders.loading_single", "Sipariş yükleniyor...")}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : order ? (
        <OrderDetail order={order} />
      ) : (
        <div className="text-sm text-slate-500">
          {t("storefront.account.orders.not_found", "Sipariş bulunamadı.")}
        </div>
      )}
    </AccountShell>
  );
}
