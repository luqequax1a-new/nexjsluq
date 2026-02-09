"use client";

import React from "react";
import type { CustomerAddress } from "@/types/order";
import AddressCard from "./AddressCard";
import { useI18n } from "@/context/I18nContext";

export default function AddressGrid({
  addresses,
  variant,
  defaultId,
  onMakeDefault,
  onDelete,
  editHrefBase,
}: {
  addresses: CustomerAddress[];
  variant: "shipping" | "billing";
  defaultId: number | null;
  onMakeDefault: (id: number) => void;
  onDelete: (id: number) => void;
  editHrefBase: string;
}) {
  const { t } = useI18n();
  if (!addresses.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        {t("storefront.account.address.empty", "Henüz adres yok.")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          variant={variant}
          isDefault={defaultId === address.id}
          onMakeDefault={onMakeDefault}
          onDelete={onDelete}
          editHref={`${editHrefBase}/${address.id}/duzenle`}
        />
      ))}
    </div>
  );
}
