"use client";

import React from "react";
import HeaderBrand from "@/components/storefront/header/HeaderBrand";
import DesktopActions from "@/components/storefront/header/DesktopActions";

export default function DesktopTopBar({ searchPlaceholder }: { searchPlaceholder: string }) {
  void searchPlaceholder;
  return (
    <div className="hidden lg:flex items-center justify-between h-[76px]">
      <div className="flex items-center gap-3 min-w-0">
        <HeaderBrand />
      </div>

      <DesktopActions />
    </div>
  );
}
