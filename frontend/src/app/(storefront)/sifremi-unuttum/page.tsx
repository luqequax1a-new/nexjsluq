import AuthShell from "@/components/storefront/auth/AuthShell";
import ForgotPasswordForm from "@/components/storefront/auth/ForgotPasswordForm";
import T from "@/components/storefront/T";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title={<T k="storefront.auth.forgot_title" fallback="Şifremi unuttum" />}
      subtitle={<T k="storefront.auth.forgot_subtitle" fallback="Şifre sıfırlama bağlantısını e-postanıza gönderelim." />}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
