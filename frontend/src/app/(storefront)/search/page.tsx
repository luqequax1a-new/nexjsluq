import React, { Suspense } from "react";
import SearchPageClient from "@/components/storefront/search/SearchPageClient";

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
