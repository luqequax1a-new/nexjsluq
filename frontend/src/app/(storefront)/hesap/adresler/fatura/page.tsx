import AccountShell from "@/components/storefront/account/AccountShell";
import AddressListSection from "@/components/storefront/account/AddressListSection";
import T from "@/components/storefront/T";

export default function BillingAddressesPage() {
  return (
    <AccountShell
      title={<T k="storefront.account.address.billing_title" fallback="Fatura adresleri" />}
      subtitle={<T k="storefront.account.address.billing_subtitle" fallback="Fatura adreslerinizi yönetin." />}
    >
      <AddressListSection
        variant="billing"
        createHref="/hesap/adresler/fatura/yeni"
        editHrefBase="/hesap/adresler/fatura"
      />
    </AccountShell>
  );
}
