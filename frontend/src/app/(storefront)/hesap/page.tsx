import AccountShell from "@/components/storefront/account/AccountShell";
import AccountDashboard from "@/components/storefront/account/AccountDashboard";
import T from "@/components/storefront/T";

export default function AccountPage() {
  return (
    <AccountShell
      title={<T k="storefront.account.title" fallback="Hesabım" />}
      subtitle={<T k="storefront.account.subtitle" fallback="Sipariş, adres ve profil bilgilerinize hızlı erişin." />}
    >
      <AccountDashboard />
    </AccountShell>
  );
}
