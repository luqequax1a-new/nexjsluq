import AuthShell from "@/components/storefront/auth/AuthShell";
import LoginForm from "@/components/storefront/auth/LoginForm";
import T from "@/components/storefront/T";

export default function LoginPage() {
  return (
    <AuthShell title={<T k="storefront.auth.login_title" fallback="Giriş Yap" />}>
      <LoginForm />
    </AuthShell>
  );
}
