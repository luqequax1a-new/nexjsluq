"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import AddressGrid from "./AddressGrid";
import { useCustomerAddresses } from "./useCustomerAddresses";
import { deleteCustomerAddress, updateCustomerAddress } from "@/lib/api/storefrontAccount";
import { useI18n } from "@/context/I18nContext";

export default function AddressListSection({
  variant,
  createHref,
  editHrefBase,
}: {
  variant: "shipping" | "billing";
  createHref: string;
  editHrefBase: string;
}) {
  const { addresses, defaultShippingId, defaultBillingId, loading, error, refresh } = useCustomerAddresses();
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { t } = useI18n();

  const defaultId = variant === "shipping" ? defaultShippingId : defaultBillingId;
  const getErrorMessage = (err: unknown, fallback: string) => {
    if (typeof err === "object" && err !== null && "message" in err) {
      const message = (err as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
    return fallback;
  };

  const makeDefault = async (id: number) => {
    setActionError(null);
    try {
      if (variant === "shipping") {
        await updateCustomerAddress(id, { is_default_shipping: true });
      } else {
        await updateCustomerAddress(id, { is_default_billing: true });
      }
      await refresh();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, t("storefront.account.address.default_failed", "Varsayilan adres guncellenemedi.")));
    }
  };

  const removeAddress = async (id: number) => {
    if (!confirm(t("storefront.account.address.delete_confirm", "Bu adres silinsin mi?"))) return;
    setActionError(null);
    try {
      await deleteCustomerAddress(id);
      await refresh();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, t("storefront.account.address.delete_failed", "Adres silinemedi.")));
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return addresses;
    return addresses.filter((addr) => {
      const haystack = [
        addr.title,
        addr.first_name,
        addr.last_name,
        addr.phone,
        addr.company,
        addr.address_line_1,
        addr.city,
        addr.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [addresses, query]);

  const hasAddress = addresses.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          {variant === "shipping"
            ? t("storefront.account.address.shipping_desc", "Siparislerin teslim edilecegi adresleri yonetin.")
            : t("storefront.account.address.billing_desc", "Faturada gorunecek adresleri yonetin.")}
        </div>

        {hasAddress ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("storefront.account.address.search_placeholder", "Adres ara...")}
              className="h-10 w-52 rounded-none border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
            />
            <Link
              href={createHref}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              {t("storefront.account.address.add_new", "Yeni adres ekle")}
            </Link>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-slate-500">
          {t("storefront.account.address.loading", "Adresler yukleniyor...")}
        </div>
      ) : !hasAddress ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-none border border-slate-300 bg-white text-xl font-semibold text-slate-700">
            +
          </div>
          <div className="text-base font-semibold text-slate-800">
            {t("storefront.account.address.empty_title", "Henuz kayitli adresiniz yok")}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            {t("storefront.account.address.empty", "Ilk adresinizi ekleyerek devam edin.")}
          </div>
          <Link
            href={createHref}
            className="mt-5 inline-flex items-center rounded-none bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
          >
            {t("storefront.account.address.add_new", "Yeni adres ekle")}
          </Link>
        </div>
      ) : filtered.length === 0 && query.trim() ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          {t("storefront.account.address.no_results", "Aramaniza uygun adres bulunamadi.")}
        </div>
      ) : (
        <AddressGrid
          addresses={filtered}
          variant={variant}
          defaultId={defaultId}
          onMakeDefault={makeDefault}
          onDelete={removeAddress}
          editHrefBase={editHrefBase}
        />
      )}
    </div>
  );
}
