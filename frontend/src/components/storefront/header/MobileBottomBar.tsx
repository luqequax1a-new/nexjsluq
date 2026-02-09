"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Heart, LayoutGrid, Package, User } from "lucide-react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

function Item({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href?: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "sf-icon-btn flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl bg-transparent focus:outline-none focus-visible:outline-none",
    active ? "text-primary" : "text-gray-500"
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {icon}
        <span className="text-[11px] font-medium leading-none">{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-label={label}>
      {icon}
      <span className="text-[11px] font-medium leading-none">{label}</span>
    </button>
  );
}

export default function MobileBottomBar() {
  const pathname = usePathname() || "/";
  const { me } = useCustomerAuth();
  const isAuthed = !!me?.customer;
  const accountHref = isAuthed ? "/hesap" : "/giris?next=/hesap";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isAccountActive = isAuthed
    ? isActive("/hesap")
    : isActive("/giris") || isActive("/kayit") || isActive("/sifremi-unuttum") || isActive("/sifre-sifirla");

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[140]">
      <div className="bg-white border-t border-gray-200 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
        <div className="container mx-auto px-3">
          <div className="h-[64px] flex items-center gap-1">
            <Item
              href="/"
              label="Ana Sayfa"
              active={isActive("/")}
              icon={<Home className="w-5 h-5" />}
            />
            <Item
              href="/favorilerim"
              label="Favoriler"
              active={isActive("/favorilerim")}
              icon={<Heart className="w-5 h-5" />}
            />
            <Item
              href="/kategoriler"
              label="Kategoriler"
              active={isActive("/kategoriler")}
              icon={<LayoutGrid className="w-5 h-5" />}
            />
            <Item
              href={accountHref}
              label="Hesap"
              active={isAccountActive}
              icon={<User className="w-5 h-5" />}
            />
            <Item
              href="/siparis-takip"
              label="Sipariş Takibi"
              active={isActive("/siparis-takip")}
              icon={<Package className="w-5 h-5" />}
            />
          </div>
        </div>

        <div className="h-4 flex items-center justify-center">
          <div className="w-12 h-1 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  );
}
