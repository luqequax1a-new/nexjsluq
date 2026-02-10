"use client";

import React, { useState } from "react";
import ProductCarousel from "@/components/storefront/sections/ProductCarousel";
import type { Unit } from "@/hooks/useUnit";

interface Tab {
  title: string;
  products: any[];
}

interface ProductTabsClientProps {
  tabs: Tab[];
  units: Unit[];
  columns?: number;
  rows?: number;
}

export default function ProductTabsClient({
  tabs,
  units,
  columns = 5,
  rows = 2,
}: ProductTabsClientProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (tabs.length === 0) return null;

  const currentProducts = tabs[activeTab]?.products || [];

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1 mb-8 border-b border-gray-200">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-3 text-sm font-semibold transition-all relative ${
              activeTab === i
                ? "text-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.title}
            {activeTab === i && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Products */}
      {currentProducts.length > 0 ? (
        <ProductCarousel
          products={currentProducts}
          units={units}
          columns={columns}
          rows={rows}
          layoutType="carousel"
          showArrows={true}
          showDots={true}
        />
      ) : (
        <div className="text-center py-12 text-gray-400 text-sm">
          Bu sekmede ürün bulunamadı
        </div>
      )}
    </div>
  );
}
