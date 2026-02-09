"use client";

import { PageLoader } from "./PageLoader";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { me, loading } = useAuth();

  const isLoginRoute = (pathname || "").startsWith("/admin/login");

  useEffect(() => {
    if (loading) return;
    if (isLoginRoute) return;
    if (me?.user) return;

    const next = encodeURIComponent(pathname || "/admin");
    router.replace(`/admin/login?next=${next}`);
  }, [loading, isLoginRoute, me, pathname, router]);

  if (loading) {
    return <PageLoader />;
  }

  if (isLoginRoute) return <>{children}</>;

  if (!me?.user) return null;

  return <>{children}</>;
}
