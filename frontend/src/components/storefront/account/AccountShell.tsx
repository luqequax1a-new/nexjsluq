"use client";

import React from "react";
import AccountGuard from "@/components/storefront/account/AccountGuard";
import AccountSidebar from "@/components/storefront/account/AccountSidebar";

export default function AccountShell({
  title,
  subtitle,
  children,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AccountGuard>
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            <AccountSidebar />
            <section className="space-y-6">
              {(title || subtitle) ? (
                <div>
                  {title ? <h1 className="text-2xl font-bold text-slate-900">{title}</h1> : null}
                  {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
                </div>
              ) : null}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                {children}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AccountGuard>
  );
}
