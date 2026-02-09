import AccountShell from "@/components/storefront/account/AccountShell";
import OrderList from "@/components/storefront/account/OrderList";
import T from "@/components/storefront/T";

export default function OrdersPage() {
  return (
    <AccountShell
      title={<T k="storefront.account.orders.title" fallback="Siparişlerim" />}
      subtitle={<T k="storefront.account.orders.subtitle" fallback="Son siparişlerinizin durumunu takip edin." />}
    >
      <OrderList />
    </AccountShell>
  );
}
