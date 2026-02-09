"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";

export default function AdvancedSearchBar({
  value,
  onChange,
  productCount,
}: {
  value: string;
  onChange: (v: string) => void;
  productCount?: number;
}) {
  return (
    <div className="w-full">
      {/* Simple header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Ürün Arama
          {typeof productCount === "number" && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({productCount.toLocaleString('tr-TR')})
            </span>
          )}
        </h2>
      </div>

      {/* Simple rectangular search input */}
      <div className="relative w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ürün ara..."
          className="w-full h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400"
        />
      </div>
    </div>
  );
}
