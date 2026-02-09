"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AccountShell from "@/components/storefront/account/AccountShell";
import AddressForm from "@/components/storefront/account/AddressForm";
import { useCustomerAddresses } from "@/components/storefront/account/useCustomerAddresses";
import { updateCustomerAddress } from "@/lib/api/storefrontAccount";
import type { CustomerAddress } from "@/types/order";
import { useI18n } from "@/context/I18nContext";

export default function EditBillingAddressPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? Number(rawId) : Array.isArray(rawId) ? Number(rawId[0]) : NaN;

  const { addresses, loading } = useCustomerAddresses();
  const address = useMemo(() => addresses.find((item) => item.id === id), [addresses, id]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: Partial<CustomerAddress>) => {
    if (!id || Number.isNaN(id)) return;
    setSaving(true);
    setError(null);
    try {
      await updateCustomerAddress(id, payload);
      router.push("/hesap/adresler/fatura");
    } catch (err: any) {
      setError(err?.message || t("storefront.account.address.update_failed", "Adres güncellenemedi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountShell
      title={t("storefront.account.address.billing_edit_title", "Fatura adresini düzenle")}
      subtitle={t("storefront.account.address.billing_edit_subtitle", "Fatura bilgilerini güncelleyin.")}
    >
      {loading ? (
        <div className="text-sm text-slate-500">
          {t("storefront.account.address.loading_single", "Adres yükleniyor...")}
        </div>
      ) : !address ? (
        <div className="text-sm text-slate-500">
          {t("storefront.account.address.not_found", "Adres bulunamadı.")}
        </div>
      ) : (
        <>
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <AddressForm variant="billing" initial={address} onSubmit={handleSubmit} submitting={saving} />
        </>
      )}
    </AccountShell>
  );
}
