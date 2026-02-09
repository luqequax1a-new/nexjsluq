"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";

const AUTH_ROUTE_REGEX = /(^|\/)(giris|kayit|sifremi-unuttum|sifre-sifirla)(\/|$)/;

function isAuthRoute(pathname: string) {
  return AUTH_ROUTE_REGEX.test(pathname);
}

export default function StorefrontChrome({
  children,
  initialMenus,
}: {
  children: React.ReactNode;
  initialMenus?: any;
}) {
  const pathname = usePathname() || "/";
  const hideChrome = isAuthRoute(pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {hideChrome ? null : <Header initialMenus={initialMenus} />}
      <main className={hideChrome ? "min-h-screen" : "flex-grow"}>{children}</main>
      {hideChrome ? null : (
        <>
          <Footer />
          {/* Mobile bottom bar spacer - footer üstünde kalmasın diye footer'dan sonra */}
          <div className="lg:hidden h-[80px]" />
        </>
      )}
    </div>
  );
}
