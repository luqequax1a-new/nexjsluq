"use client";

import { useCallback, useEffect, useState } from "react";
import type { CustomerAddress } from "@/types/order";
import { getCustomerAddresses } from "@/lib/api/storefrontAccount";
import { useI18n } from "@/context/I18nContext";

export function useCustomerAddresses() {
  const { t } = useI18n();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [defaultShippingId, setDefaultShippingId] = useState<number | null>(null);
  const [defaultBillingId, setDefaultBillingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCustomerAddresses();
      setAddresses(res.addresses || []);
      setDefaultShippingId((res.default_shipping_id ?? null) as number | null);
      setDefaultBillingId((res.default_billing_id ?? null) as number | null);
      setError(null);
    } catch (err) {
      setError(t("storefront.account.address.load_failed", "Adresler yüklenemedi."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    addresses,
    defaultShippingId,
    defaultBillingId,
    loading,
    error,
    refresh,
  };
}
