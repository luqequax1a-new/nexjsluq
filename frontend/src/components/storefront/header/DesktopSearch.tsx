"use client";

import React from "react";
import Link from "next/link";
import { HeaderIcons } from "@/components/storefront/header/HeaderIcons";

export default function DesktopSearch({ placeholder }: { placeholder: string }) {
  return (
    <div className="hidden lg:flex flex-1 max-w-[640px] mx-10">
      <Link
        href="/search"
        className="w-full h-[46px] bg-[#f1f5f9] border border-transparent rounded-xl px-5 flex items-center justify-between text-sm font-medium text-gray-600 hover:bg-[#eaf0f6] transition-colors"
        aria-label="Ara"
      >
        <span className="text-gray-500">{placeholder}</span>
        <HeaderIcons.Search className="text-gray-700" />
      </Link>
    </div>
  );
}
