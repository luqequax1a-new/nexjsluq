import AccountShell from "@/components/storefront/account/AccountShell";
import CouponList from "@/components/storefront/account/CouponList";
import T from "@/components/storefront/T";

export default function CouponsPage() {
  return (
    <AccountShell
      title={<T k="storefront.account.coupons.title" fallback="Kuponlarım" />}
      subtitle={<T k="storefront.account.coupons.subtitle" fallback="Hesabınıza tanımlanan kuponlar." />}
    >
      <CouponList />
    </AccountShell>
  );
}
