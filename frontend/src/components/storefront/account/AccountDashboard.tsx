"use client";

import React from "react";
import Link from "next/link";
import { Package, MapPin, Tag, User } from "lucide-react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useI18n } from "@/context/I18nContext";

export default function AccountDashboard() {
  const { me } = useCustomerAuth();
  const { t } = useI18n();
  const fullName = me?.customer
    ? `${me.customer.first_name} ${me.customer.last_name}`
    : t("storefront.account.customer_fallback", "Müşteri");
  const cards = [
    {
      href: "/hesap/siparisler",
      title: t("storefront.account.cards.orders", "Siparişlerim"),
      description: t("storefront.account.cards.orders_desc", "Son siparişlerinizi ve detaylarını takip edin."),
      icon: Package,
    },
    {
      href: "/hesap/adresler/teslimat",
      title: t("storefront.account.cards.addresses", "Adreslerim"),
      description: t("storefront.account.cards.addresses_desc", "Teslimat ve fatura adreslerini yönetin."),
      icon: MapPin,
    },
    {
      href: "/hesap/kuponlar",
      title: t("storefront.account.cards.coupons", "Kuponlarım"),
      description: t("storefront.account.cards.coupons_desc", "Tanımlı kuponları ve kullanım limitlerini görün."),
      icon: Tag,
    },
    {
      href: "/hesap/profil",
      title: t("storefront.account.cards.profile", "Profilim"),
      description: t("storefront.account.cards.profile_desc", "İletişim bilgilerinizi ve şifrenizi güncelleyin."),
      icon: User,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
        <div className="text-sm text-slate-500">
          {t("storefront.account.welcome", "Hoş geldiniz")}
        </div>
        <div className="mt-1 text-xl font-semibold text-slate-900">{fullName}</div>
        <div className="mt-2 text-sm text-slate-500">
          {t(
            "storefront.account.welcome_desc",
            "Siparişlerinizi, adreslerinizi, kuponlarınızı ve profilinizi buradan yönetin."
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{card.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{card.description}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
