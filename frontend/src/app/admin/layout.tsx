"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AuthGuard } from "@/components/admin/AuthGuard";
import { AuthProvider } from "@/context/AuthContext";
import { PageHeaderProvider } from "@/context/PageHeaderContext";
import { I18nProvider } from "@/context/I18nContext";

export default function AdminLayout({
  children,
  overlay,
}: {
  children: React.ReactNode;
  overlay: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginRoute = (pathname || "").startsWith("/admin/login");

  if (isLoginRoute) return <>{children}</>;

  return (
    <AuthProvider>
      <AuthGuard>
        <I18nProvider>
          <PageHeaderProvider>
            <AdminShell>
              {children}
            </AdminShell>
            {overlay}
          </PageHeaderProvider>
        </I18nProvider>
      </AuthGuard>
    </AuthProvider>
  );
}
