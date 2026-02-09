"use client";

import { useParams } from "next/navigation";
import AuthShell from "@/components/storefront/auth/AuthShell";
import ResetPasswordForm from "@/components/storefront/auth/ResetPasswordForm";
import T from "@/components/storefront/T";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  return (
    <AuthShell
      title={<T k="storefront.auth.reset_title" fallback="Şifre sıfırla" />}
      subtitle={<T k="storefront.auth.reset_subtitle" fallback="Hesabınız için yeni bir şifre belirleyin." />}
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
