import AccountShell from "@/components/storefront/account/AccountShell";
import AddressListSection from "@/components/storefront/account/AddressListSection";
import T from "@/components/storefront/T";

export default function ShippingAddressesPage() {
  return (
    <AccountShell
      title={<T k="storefront.account.address.shipping_title" fallback="Teslimat adresleri" />}
      subtitle={<T k="storefront.account.address.shipping_subtitle" fallback="Teslimat adreslerinizi yönetin." />}
    >
      <AddressListSection
        variant="shipping"
        createHref="/hesap/adresler/teslimat/yeni"
        editHrefBase="/hesap/adresler/teslimat"
      />
    </AccountShell>
  );
}
