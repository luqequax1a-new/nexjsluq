"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

function AdminShellSkeleton() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#fff" }}>
      {/* Sidebar skeleton */}
      <div style={{ width: 260, minWidth: 260, background: "#0e0e10", display: "flex", flexDirection: "column", padding: "20px 16px" }}>
        {/* Logo placeholder */}
        <div style={{ height: 32, width: 140, background: "#1a1a1e", borderRadius: 8, marginBottom: 32 }} />
        {/* Menu items skeleton */}
        {[120, 90, 110, 80, 100, 130, 95].map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
            <div style={{ width: 20, height: 20, background: "#1a1a1e", borderRadius: 6, flexShrink: 0 }} />
            <div style={{ height: 14, width: w, background: "#1a1a1e", borderRadius: 6 }} />
          </div>
        ))}
        {/* Profile skeleton at bottom */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: "1px solid #1a1a1a" }}>
          <div style={{ width: 38, height: 38, background: "#1a1a1e", borderRadius: 12, flexShrink: 0 }} />
          <div>
            <div style={{ height: 12, width: 80, background: "#1a1a1e", borderRadius: 4, marginBottom: 6 }} />
            <div style={{ height: 10, width: 120, background: "#1a1a1e", borderRadius: 4 }} />
          </div>
        </div>
      </div>
      {/* Content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header skeleton */}
        <div style={{ height: 64, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 24px", gap: 16 }}>
          <div style={{ height: 18, width: 160, background: "#f1f5f9", borderRadius: 6 }} />
          <div style={{ marginLeft: "auto", height: 36, width: 100, background: "#f1f5f9", borderRadius: 8 }} />
        </div>
        {/* Content skeleton */}
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ height: 28, width: 240, background: "#f1f5f9", borderRadius: 8 }} />
          <div style={{ height: 16, width: 360, background: "#f8fafc", borderRadius: 6 }} />
          <div style={{ height: 200, background: "#f8fafc", borderRadius: 12, marginTop: 8 }} />
        </div>
      </div>
    </div>
  );
}

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
    return <AdminShellSkeleton />;
  }

  if (isLoginRoute) return <>{children}</>;

  if (!me?.user) return null;

  return <>{children}</>;
}
