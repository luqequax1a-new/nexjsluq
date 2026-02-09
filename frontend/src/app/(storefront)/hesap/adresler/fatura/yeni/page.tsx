"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AccountShell from "@/components/storefront/account/AccountShell";
import AddressForm from "@/components/storefront/account/AddressForm";
import { createCustomerAddress, type CustomerAddressPayload } from "@/lib/api/storefrontAccount";
import type { CustomerAddress } from "@/types/order";
import T from "@/components/storefront/T";
import { useI18n } from "@/context/I18nContext";

export default function NewBillingAddressPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: Partial<CustomerAddress>) => {
    setSaving(true);
    setError(null);
    try {
      await createCustomerAddress(payload as CustomerAddressPayload);
      router.push("/hesap/adresler/fatura");
    } catch (err: any) {
      setError(err?.message || t("storefront.account.address.save_failed", "Adres kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountShell
      title={<T k="storefront.account.address.billing_new_title" fallback="Yeni fatura adresi" />}
      subtitle={<T k="storefront.account.address.billing_new_subtitle" fallback="Yeni bir fatura adresi ekleyin." />}
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AddressForm variant="billing" onSubmit={handleSubmit} submitting={saving} />
    </AccountShell>
  );
}
