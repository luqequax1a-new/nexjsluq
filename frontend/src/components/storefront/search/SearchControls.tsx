"use client";

import React from "react";

export default function SearchControls({
  value,
  onChange,
  sort,
  onSort,
  min,
  max,
  onMin,
  onMax,
}: {
  value: string;
  onChange: (v: string) => void;
  sort: string;
  onSort: (v: string) => void;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 lg:p-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-6">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ürün ara..."
            className="w-full h-11 bg-[#f1f5f9] border border-transparent rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/20 outline-none"
          />
        </div>

        <div className="lg:col-span-3">
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            className="w-full h-11 bg-[#f1f5f9] border border-transparent rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/20 outline-none"
          >
            <option value="">Sıralama</option>
            <option value="newest">En yeni</option>
            <option value="price_asc">Fiyat artan</option>
            <option value="price_desc">Fiyat azalan</option>
          </select>
        </div>

        <div className="lg:col-span-3 grid grid-cols-2 gap-3">
          <input
            value={min}
            onChange={(e) => onMin(e.target.value)}
            placeholder="Min ₺"
            inputMode="decimal"
            className="w-full h-11 bg-[#f1f5f9] border border-transparent rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/20 outline-none"
          />
          <input
            value={max}
            onChange={(e) => onMax(e.target.value)}
            placeholder="Max ₺"
            inputMode="decimal"
            className="w-full h-11 bg-[#f1f5f9] border border-transparent rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/20 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
