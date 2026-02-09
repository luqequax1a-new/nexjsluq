"use client";

import React from "react";
import Link from "next/link";
import { HeaderIcons } from "@/components/storefront/header/HeaderIcons";
import { formatCount } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

function Badge({ count }: { count: number }) {
  if (!count || count <= 0) return null;
  const display = formatCount(count);
  return (
    <span className="absolute -top-1 -right-1 bg-[#ff0000] text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold">
      {display}
    </span>
  );
}

function IconButton({ href, label, count, children, onClick, minimal = false }: {
  href?: string;
  label: string;
  count?: number;
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  minimal?: boolean;
}) {
  const buttonClass = minimal
    ? "sf-icon-btn relative inline-flex items-center justify-center p-1 text-gray-800 hover:text-black transition-colors focus:outline-none"
    : "sf-icon-btn relative w-11 h-11 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none focus-visible:outline-none active:bg-transparent";

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        className={buttonClass}
      >
        {children}
        <Badge count={count || 0} />
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={buttonClass}
    >
      {children}
      <Badge count={count || 0} />
    </button>
  );
}

export default function DesktopActions() {
  // Safe cart context usage with fallback
  let itemCount = 0;
  let setIsOpen: (open: boolean) => void = () => {};
  let isAuthed = false;

  try {
    const cart = useCart();
    itemCount = cart.itemCount;
    setIsOpen = cart.setIsOpen;
  } catch (error) {
    // CartProvider not available, use fallback values
    console.warn("CartContext not available in DesktopActions", error);
  }

  try {
    const auth = useCustomerAuth();
    isAuthed = !!auth.me?.customer;
  } catch (error) {
    console.warn("CustomerAuthContext not available in DesktopActions", error);
  }

  const accountHref = isAuthed ? "/hesap" : "/giris?next=/hesap";

  return (
    <div className="hidden lg:flex items-center gap-2">
      <IconButton href="/search" label="Ara" minimal>
        <HeaderIcons.Search className="text-gray-800" />
      </IconButton>
      <IconButton href="/favorilerim" label="Favoriler" count={2}>
        <HeaderIcons.Heart className="text-gray-800" />
      </IconButton>
      <IconButton href="/siparis-takip" label="Sipariş Takibi">
        <HeaderIcons.Box className="text-gray-800" />
      </IconButton>
      <IconButton
        label="Sepet"
        count={itemCount}
        onClick={(e) => {
          e?.preventDefault();
          setIsOpen(true);
        }}
      >
        <HeaderIcons.Cart className="text-gray-800" />
      </IconButton>
      <IconButton href={accountHref} label="Hesabim">
        <HeaderIcons.User className="text-gray-800" />
      </IconButton>
    </div>
  );
}
