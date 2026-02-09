import AccountShell from "@/components/storefront/account/AccountShell";
import ProfileForm from "@/components/storefront/account/ProfileForm";
import T from "@/components/storefront/T";

export default function ProfilePage() {
  return (
    <AccountShell
      title={<T k="storefront.account.profile.title" fallback="Profilim" />}
      subtitle={<T k="storefront.account.profile.subtitle" fallback="Kişisel bilgilerinizi güncelleyin." />}
    >
      <ProfileForm />
    </AccountShell>
  );
}
