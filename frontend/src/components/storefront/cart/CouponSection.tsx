"use client";

import React, { useState } from "react";
import { CheckOutlined, DownOutlined, TagOutlined } from "@ant-design/icons";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export function CouponSection() {
  const { cart, applyCoupon, removeCoupon } = useCart();
  const [couponFieldOpen, setCouponFieldOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const formatMoneyCompact = (v: unknown) => {
    const s = formatPrice(Number(v) || 0);
    return s.replace(/,00$/, "").replace(/\.00$/, "");
  };

  const coupon_id = cart?.coupon_id ?? null;
  const coupon_discount = Number(cart?.coupon_discount ?? 0);
  const discount_total = Number(cart?.discount_total ?? 0);
  const hasCoupon = !!coupon_id || coupon_discount > 0 || discount_total > 0;
  const appliedDiscount = coupon_discount || discount_total;

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponError("Kupon kodunu girin.");
      return;
    }

    try {
      setApplyingCoupon(true);
      setCouponError(null);
      await applyCoupon(code);
      setCouponCode("");
      setCouponFieldOpen(false);
    } catch (error) {
      setCouponError("Kupon uygulanamadı.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  return (
    <div
      className={
        "border rounded-xl px-4 py-3 transition-all " +
        (hasCoupon ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white")
      }
    >
      {!hasCoupon ? (
        <button
          type="button"
          onClick={() => setCouponFieldOpen((v) => !v)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <TagOutlined style={{ fontSize: 20, color: "#6366f1" }} />
            <span className="font-bold text-[14px] text-slate-900">İndirim / Hediye Kodu</span>
          </div>
          <span
            className="transition-transform duration-300 text-slate-500"
            style={{ transform: couponFieldOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <DownOutlined />
          </span>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
              <CheckOutlined />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wide">
                Kupon Uygulandı
              </div>
              <div className="text-[14px] font-extrabold text-emerald-950 font-mono truncate">
                {appliedDiscount > 0 ? `-${formatMoneyCompact(appliedDiscount)}` : "Aktif"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void removeCoupon()}
            className="text-red-500 font-bold text-[12px] underline"
          >
            Kaldır
          </button>
        </div>
      )}

      {!hasCoupon && couponFieldOpen ? (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex w-full">
            <input
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setCouponError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleApplyCoupon();
              }}
              placeholder="Kupon kodunu girin"
              className="h-11 flex-1 px-4 border border-slate-200 rounded-l-lg outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              disabled={applyingCoupon}
              onClick={() => void handleApplyCoupon()}
              className={
                "h-11 px-5 rounded-r-lg font-bold text-white border-0 " +
                (applyingCoupon ? "bg-slate-400" : "bg-slate-900 hover:bg-black")
              }
            >
              {applyingCoupon ? "..." : "Uygula"}
            </button>
          </div>

          {couponError ? (
            <div className="mt-2 text-[12px] text-red-500 font-medium">{couponError}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
