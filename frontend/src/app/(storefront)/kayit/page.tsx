import AuthShell from "@/components/storefront/auth/AuthShell";
import RegisterForm from "@/components/storefront/auth/RegisterForm";
import T from "@/components/storefront/T";

export default function RegisterPage() {
  return (
    <AuthShell title={<T k="storefront.auth.register_title" fallback="Hesap Oluştur" />}>
      <RegisterForm />
    </AuthShell>
  );
}
