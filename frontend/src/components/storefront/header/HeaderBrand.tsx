"use client";

import React from "react";
import Link from "next/link";
import StoreLogo from "@/components/storefront/StoreLogo";

export default function HeaderBrand() {
  return (
    <Link href="/" className="flex items-center">
      <StoreLogo width={180} height={64} className="shrink-0" roundedClassName="rounded-lg" fallbackText="F" />
    </Link>
  );
}
