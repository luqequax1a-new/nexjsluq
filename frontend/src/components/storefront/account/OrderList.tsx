"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCustomerOrders } from "@/lib/api/storefrontAccount";
import type { Order } from "@/types/order";
import { useI18n } from "@/context/I18nContext";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  processing: "Hazırlanıyor",
  shipped: "Kargoya verildi",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  processing: "bg-indigo-50 text-indigo-700",
  shipped: "bg-sky-50 text-sky-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
  refunded: "bg-slate-100 text-slate-600",
};

export default function OrderList() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getCustomerOrders({ per_page: 15 });
        if (!mounted) return;
        setOrders(res.data || []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesQuery = !q || String(order.order_number || "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, statusFilter]);

  if (loading) {
    return (
      <div className="text-sm text-slate-500">
        {t("storefront.account.orders.loading", "Siparişler yükleniyor...")}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        {t("storefront.account.orders.empty", "Henüz sipariş yok.")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("storefront.account.orders.search_placeholder", "Sipariş numarası ara...")}
          className="h-10 w-60 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
        >
          <option value="all">{t("storefront.account.orders.all_statuses", "Tüm durumlar")}</option>
          {Object.keys(statusLabels).map((key) => (
            <option key={key} value={key}>
              {t(`storefront.account.orders.status.${key}`, statusLabels[key])}
            </option>
          ))}
        </select>
        <div className="text-xs text-slate-500">
          {t("storefront.account.orders.count", "Toplam")}: {filtered.length}
        </div>
      </div>

      {filtered.map((order) => (
        <Link
          key={order.id}
          href={`/hesap/siparisler/${order.id}`}
          className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-300"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500">
                {t("storefront.account.orders.label", "Sipariş")}
              </div>
              <div className="text-lg font-semibold text-slate-900">{order.order_number}</div>
            </div>
            <div className="text-sm text-slate-500">
              {new Date(order.created_at).toLocaleDateString("tr-TR")}
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {Number(order.grand_total || 0).toFixed(2)} {order.currency_code || "TRY"}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusStyles[order.status] || "bg-slate-100 text-slate-600"
              }`}
            >
              {t(`storefront.account.orders.status.${order.status}`, statusLabels[order.status] || order.status)}
            </span>
          </div>
        </Link>
      ))}

      {!filtered.length ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          {t("storefront.account.orders.no_results", "Seçilen filtreye uygun sipariş bulunamadı.")}
        </div>
      ) : null}
    </div>
  );
}
