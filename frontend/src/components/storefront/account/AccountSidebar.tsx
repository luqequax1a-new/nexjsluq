"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { Home, Package, Tag, MapPin, FileText, User } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export default function AccountSidebar() {
  const pathname = usePathname() || "";
  const { me, logout } = useCustomerAuth();
  const { t } = useI18n();
  const customer = me?.customer;
  const fullName = customer
    ? `${customer.first_name} ${customer.last_name}`
    : t("storefront.account.customer_fallback", "Müşteri");
  const navItems = [
    { href: "/hesap", label: t("storefront.account.nav.overview", "Özet"), icon: Home },
    { href: "/hesap/siparisler", label: t("storefront.account.nav.orders", "Siparişlerim"), icon: Package },
    { href: "/hesap/kuponlar", label: t("storefront.account.nav.coupons", "Kuponlarım"), icon: Tag },
    { href: "/hesap/adresler/teslimat", label: t("storefront.account.nav.shipping", "Teslimat adresleri"), icon: MapPin },
    { href: "/hesap/adresler/fatura", label: t("storefront.account.nav.billing", "Fatura adresleri"), icon: FileText },
    { href: "/hesap/profil", label: t("storefront.account.nav.profile", "Profilim"), icon: User },
  ];

  return (
    <aside className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {t("storefront.account.label", "Hesabım")}
        </div>
        <div className="mt-3 text-lg font-semibold text-slate-900">{fullName}</div>
        <div className="text-sm text-slate-500">{customer?.email}</div>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
        >
          {t("storefront.account.sign_out", "Çıkış yap")}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition " +
                  (active
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
