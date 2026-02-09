"use client";

import React, { useEffect } from "react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/context/I18nContext";

export default function AccountGuard({ children }: { children: React.ReactNode }) {
  const { me, loading } = useCustomerAuth();
  const router = useRouter();
  const pathname = usePathname() || "/hesap";
  const { t } = useI18n();

  useEffect(() => {
    if (loading) return;
    if (!me?.customer) {
      const next = encodeURIComponent(pathname);
      router.replace(`/giris?next=${next}`);
    }
  }, [loading, me, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500">
          {t("storefront.account.loading", "Hesap yükleniyor...")}
        </div>
      </div>
    );
  }

  if (!me?.customer) {
    return null;
  }

  return <>{children}</>;
}
