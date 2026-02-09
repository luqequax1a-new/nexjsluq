"use client";

import React from "react";
import { LayoutGrid, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export default function MobileToolbar({
  onToggleGrid,
  onOpenFilter,
  onOpenSort,
}: {
  onToggleGrid: () => void;
  onOpenFilter: () => void;
  onOpenSort: () => void;
}) {
  return (
    <div className="lg:hidden bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="h-12 flex items-center">
        <button
          type="button"
          onClick={onToggleGrid}
          className="flex-1 h-full flex items-center justify-center gap-2 text-sm text-gray-700"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <button
          type="button"
          onClick={onOpenFilter}
          className="flex-1 h-full flex items-center justify-center gap-2 text-sm text-gray-700"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtrele
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <button
          type="button"
          onClick={onOpenSort}
          className="flex-1 h-full flex items-center justify-center gap-2 text-sm text-gray-700"
        >
          <ArrowUpDown className="w-4 h-4" />
          Sırala
        </button>
      </div>
    </div>
  );
}
