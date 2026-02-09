"use client";

import React, { useEffect, useState } from "react";
import CouponCard from "./CouponCard";
import { getCustomerCoupons } from "@/lib/api/storefrontAccount";
import { useI18n } from "@/context/I18nContext";

export default function CouponList() {
  const { t } = useI18n();
  const [items, setItems] = useState<Array<{ coupon: any; used_count: number; remaining_usage: number | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getCustomerCoupons();
        if (!mounted) return;
        setItems(res.coupons || []);
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
        {t("storefront.account.coupons.loading", "Kuponlar yükleniyor...")}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        {t("storefront.account.coupons.empty", "Henüz tanımlı kupon yok.")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map((item, index) => (
        <CouponCard
          key={`${item.coupon?.id ?? index}`}
          coupon={item.coupon}
          usedCount={item.used_count}
          remainingUsage={item.remaining_usage}
        />
      ))}
    </div>
  );
}
