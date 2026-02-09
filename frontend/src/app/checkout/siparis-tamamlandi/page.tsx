"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircleFilled, ShoppingOutlined, SearchOutlined } from "@ant-design/icons";

export default function OrderCompletePage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="flex justify-center mb-5">
          <CheckCircleFilled style={{ fontSize: 64, color: "#22c55e" }} />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
          Siparişiniz Alındı!
        </h1>

        {orderNumber ? (
          <p className="text-base text-slate-600 mb-1">
            Sipariş Numaranız: <span className="font-bold text-slate-900">#{orderNumber}</span>
          </p>
        ) : null}

        <p className="text-sm text-slate-500 mb-8">
          Siparişiniz başarıyla oluşturuldu. Sipariş durumunuzu takip edebilirsiniz.
        </p>

        <div className="space-y-3">
          <Link
            href="/siparis-takip"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-lg font-extrabold text-white"
            style={{ background: "#6366f1" }}
          >
            <SearchOutlined />
            Sipariş Takip
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-lg font-extrabold border border-slate-300 text-slate-900 hover:bg-slate-50"
          >
            <ShoppingOutlined />
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </div>
  );
}
