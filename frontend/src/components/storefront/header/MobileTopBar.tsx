"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { HeaderIcons } from "@/components/storefront/header/HeaderIcons";
import { useStorefrontSettings } from "@/context/StorefrontSettingsContext";
import { useCart } from "@/context/CartContext";
import { formatCount } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path.replace("http://127.0.0.1:8000", "http://localhost:8000");
  if (path.startsWith("/")) return `${API_URL}${path}`;
  return `${API_URL}/${path}`;
}

export default function MobileTopBar({
  onOpenMenu,
  onOpenSupport,
}: {
  onOpenMenu: () => void;
  onOpenSupport: () => void;
}) {
  const { settings } = useStorefrontSettings();
  const { itemCount, setIsOpen } = useCart();
  const cartCountText = formatCount(itemCount);
  const logoSrc = getImageUrl(settings.logo);
  return (
    <div className="lg:hidden h-[64px] flex items-center justify-between">
      <div className="flex items-center min-w-0">
        <button
          type="button"
          className="sf-icon-btn w-11 h-11 rounded-xl flex items-center justify-center bg-transparent focus:outline-none focus-visible:outline-none"
          onClick={onOpenMenu}
          aria-label="Menuyu Ac"
        >
          <HeaderIcons.Hamburger className="text-gray-800" />
        </button>

        <Link href="/" className="flex items-center min-w-0" aria-label="Ana Sayfa">
          {logoSrc ? (
            <div className="relative ml-2" style={{ width: 200, height: 50 }}>
              <Image
                src={logoSrc}
                alt={settings.store_name || "Store Logo"}
                fill
                sizes="200px"
                className="object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                priority
              />
            </div>
          ) : settings.store_name ? (
            <span className="ml-2 text-[18px] font-semibold text-[#0e1e3e] truncate max-w-[220px]">
              {settings.store_name}
            </span>
          ) : null}
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <Link
          href="/search"
          className="sf-icon-btn inline-flex items-center justify-center p-1 text-gray-800 focus:outline-none focus-visible:outline-none"
          aria-label="Ara"
        >
          <HeaderIcons.Search className="text-gray-800" />
        </Link>

        <button
          type="button"
          className="sf-icon-btn relative w-11 h-11 rounded-xl flex items-center justify-center bg-transparent focus:outline-none focus-visible:outline-none"
          onClick={() => setIsOpen(true)}
          aria-label="Sepet"
        >
          <HeaderIcons.Cart className="text-gray-800" />
          {itemCount > 0 ? (
            <span className="absolute -top-1 -right-1 bg-[#ff0000] text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold">
              {cartCountText}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          className="sf-icon-btn w-11 h-11 rounded-xl flex items-center justify-center bg-transparent focus:outline-none focus-visible:outline-none"
          onClick={onOpenSupport}
          aria-label="Destek"
        >
          <HeaderIcons.Chat className="text-gray-800" />
        </button>
      </div>
    </div>
  );
}
