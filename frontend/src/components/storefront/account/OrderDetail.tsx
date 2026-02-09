"use client";

import React from "react";
import type { Order, OrderItem } from "@/types/order";
import { useI18n } from "@/context/I18nContext";
import TrackingProgress from "@/components/storefront/order-tracking/TrackingProgress";
import { getImageUrl } from "@/lib/media/getImageUrl";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandi",
  processing: "Hazirlaniyor",
  shipped: "Kargoya verildi",
  delivered: "Teslim edildi",
  cancelled: "Iptal edildi",
  refunded: "Iade edildi",
};

const paymentMethodLabels: Record<string, string> = {
  cash_on_delivery: "Kapida Odeme",
  bank_transfer: "Havale / EFT",
  credit_card: "Kredi Karti",
  card: "Kredi Karti",
  online: "Online Odeme",
};

const shippingMethodLabels: Record<string, string> = {
  standard: "Standart Kargo",
  express: "Hizli Kargo",
  pickup: "Magazadan Teslim",
};

type UnitMeta = {
  quantity_prefix?: string | null;
  stock_prefix?: string | null;
  suffix?: string | null;
  price_prefix?: string | null;
};

type ProductMeta = {
  id: number;
  name: string;
  unit?: UnitMeta | null;
};

type VariantImageMeta = {
  path?: string | null;
  url?: string | null;
};

type VariantMeta = {
  id: number;
  name: string;
  base_image?: VariantImageMeta | null;
  media?: VariantImageMeta[] | null;
};

const formatCodeLabel = (code: string | null | undefined): string => {
  const raw = String(code || "").trim();
  if (!raw) return "-";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatQty = (value: unknown): string => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  const fixed = num.toFixed(3);
  return fixed.replace(/\.?0+$/, "");
};

export default function OrderDetail({ order }: { order: Order }) {
  const { t } = useI18n();

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: order.currency_code || "TRY" }).format(value || 0);

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const resolvePaymentMethod = (code: string | null) => {
    if (!code) return "-";
    return paymentMethodLabels[code] || formatCodeLabel(code);
  };

  const resolveShippingMethod = (code: string | null) => {
    if (!code) return "-";
    return shippingMethodLabels[code] || formatCodeLabel(code);
  };

  const resolveStatus = (status: string) => {
    return statusLabels[status] || formatCodeLabel(status);
  };

  const getQuantitySuffix = (item: OrderItem): string => {
    const product = item.product as ProductMeta | undefined;
    const unit = product?.unit;
    return String(unit?.stock_prefix || unit?.quantity_prefix || unit?.suffix || item.unit_label || "").trim();
  };

  const getPriceSuffix = (item: OrderItem): string => {
    const product = item.product as ProductMeta | undefined;
    return String(product?.unit?.price_prefix || "").trim();
  };

  const getItemImage = (item: OrderItem): string => {
    const variant = item.variant as VariantMeta | undefined;
    const variantBase = variant?.base_image?.path || variant?.base_image?.url;
    const variantFirstMedia = Array.isArray(variant?.media)
      ? variant?.media?.[0]?.path || variant?.media?.[0]?.url
      : null;
    return getImageUrl(variantBase || variantFirstMedia || item.image);
  };

  const formatOptions = (options: Record<string, string> | null | undefined): string | null => {
    if (!options) return null;
    const list = Object.entries(options)
      .filter(([, value]) => String(value || "").trim() !== "")
      .map(([key, value]) => `${key}: ${value}`);
    return list.length ? list.join(" | ") : null;
  };

  const shippingMethod = resolveShippingMethod(order.shipping_method);
  const paymentMethod = resolvePaymentMethod(order.payment_method);
  const hasDiscount = Number(order.discount_total || 0) > 0;
  const discountLabel = order.coupon_code
    ? `${t("storefront.account.orders.discount", "Indirim")} (Kupon: ${order.coupon_code})`
    : t("storefront.account.orders.discount", "Indirim");

  return (
    <div className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 text-sm">
            <div className="whitespace-nowrap">
              <span className="font-bold text-slate-900">{t("storefront.account.orders.number", "Siparis No")}:</span>{" "}
              <span className="text-black">#{order.order_number}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900">{t("storefront.account.orders.date", "Tarih")}:</span>{" "}
              <span className="text-black">{formatDateTime(order.created_at)}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900">{t("storefront.account.orders.payment_method", "Odeme")}:</span>{" "}
              <span className="text-black">{paymentMethod}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900">{t("storefront.account.orders.shipping_method", "Kargo")}:</span>{" "}
              <span className="text-black">{shippingMethod}</span>
            </div>
          </div>

          <div className="shrink-0">
            <span className="inline-flex border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-900">
              {t(`storefront.account.orders.status.${order.status}`, resolveStatus(order.status))}
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 px-4 py-3">
        <TrackingProgress status={order.status} />
      </div>

      <div className="grid grid-cols-1 border-b border-slate-200 md:grid-cols-2">
        <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("storefront.account.orders.billing_address", "Fatura adresi")}
          </div>
          {order.billing_address ? (
            <div className="space-y-1 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">
                {order.billing_address.first_name} {order.billing_address.last_name}
              </div>
              <div>{order.billing_address.address_line_1}</div>
              <div>
                {order.billing_address.state ? `${order.billing_address.state} / ` : ""}
                {order.billing_address.city}
              </div>
              {order.billing_address.phone ? <div>{order.billing_address.phone}</div> : null}
            </div>
          ) : (
            <div className="text-sm text-slate-500">{t("storefront.account.orders.no_billing", "Fatura adresi yok")}</div>
          )}
        </div>

        <div className="p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("storefront.account.orders.shipping_address", "Teslimat adresi")}
          </div>
          {order.shipping_address ? (
            <div className="space-y-1 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">
                {order.shipping_address.first_name} {order.shipping_address.last_name}
              </div>
              <div>{order.shipping_address.address_line_1}</div>
              <div>
                {order.shipping_address.state ? `${order.shipping_address.state} / ` : ""}
                {order.shipping_address.city}
              </div>
              {order.shipping_address.phone ? <div>{order.shipping_address.phone}</div> : null}
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              {t("storefront.account.orders.no_shipping", "Teslimat adresi yok")}
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-700">
          {t("storefront.account.orders.items", "Urunler")}
        </div>

        <div className="divide-y divide-slate-200">
          {(order.items || []).map((item) => {
            const optionText = formatOptions(item.options);
            const qtySuffix = getQuantitySuffix(item);
            const priceSuffix = getPriceSuffix(item);
            return (
              <div key={item.id} className="px-4 py-4">
                <div className="flex gap-3 items-stretch">
                  <div className="h-16 w-16 shrink-0 border border-slate-200 bg-white p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getItemImage(item)}
                      alt={item.name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                      {optionText ? <div className="mt-1 text-xs text-slate-600">{optionText}</div> : null}
                      <div className="mt-1 text-xs text-slate-600">
                        <span className="font-bold text-slate-800">SKU:</span> {item.sku || "-"}
                      </div>
                      {(item as any).offer_data?.offer_name && (
                        <div className="mt-1 inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
                          {(item as any).offer_data.offer_name}
                        </div>
                      )}
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[12px] font-semibold leading-tight text-slate-900">
                      <div className="flex items-baseline gap-[2px] text-slate-800">
                        <span className="tabular-nums font-semibold text-slate-900">{formatQty(item.quantity)}</span>
                        {qtySuffix ? <span className="text-[11px] font-semibold text-slate-900">{qtySuffix}</span> : null}
                        <span className="font-bold text-slate-900">×</span>
                        <span className="tabular-nums">
                          {formatMoney(Number(item.unit_price || 0))}
                          {priceSuffix ? ` ${priceSuffix}` : ""}
                        </span>
                      </div>

                      <span className="tabular-nums font-semibold text-slate-900">
                        {formatMoney(Number(item.line_total || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="ml-auto w-full max-w-md space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">{t("storefront.account.orders.subtotal", "Ara toplam")}</span>
            <span className="font-semibold text-slate-900">{formatMoney(Number(order.subtotal || 0))}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">
              {t("storefront.account.orders.shipping_total", "Kargo")}
              {shippingMethod !== "-" ? ` (${shippingMethod})` : ""}
            </span>
            <span className="font-semibold text-slate-900">{formatMoney(Number(order.shipping_total || 0))}</span>
          </div>

          {Number(order.payment_fee || 0) !== 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                {t("storefront.account.orders.payment_fee", "Odeme Ucreti")}
                {paymentMethod !== "-" ? ` (${paymentMethod})` : ""}
              </span>
              <span className="font-semibold text-slate-900">
                {Number(order.payment_fee) < 0 ? "-" : ""}
                {formatMoney(Math.abs(Number(order.payment_fee || 0)))}
              </span>
            </div>
          ) : null}

          {hasDiscount ? (
            <div className="flex items-center justify-between">
              <span className="text-slate-600">{discountLabel}</span>
              <span className="font-semibold text-emerald-700">-{formatMoney(Number(order.discount_total || 0))}</span>
            </div>
          ) : null}

          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-base">
            <span className="font-bold text-slate-900">{t("storefront.account.orders.total", "Genel toplam")}</span>
            <span className="font-black text-slate-900">{formatMoney(Number(order.grand_total || 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
