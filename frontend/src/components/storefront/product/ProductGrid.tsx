"use client";

import React from "react";
import type { Unit } from "@/hooks/useUnit";
import ProductCard, { type ProductLike } from "@/components/storefront/product/ProductCard";

export default function ProductGrid({
  products,
  units = [],
  cols = 2,
  desktopCols,
}: {
  products: ProductLike[];
  units?: Unit[];
  cols?: 1 | 2;
  desktopCols?: 2 | 3 | 4;
}) {
  const baseCols = cols === 1 ? "grid-cols-1" : "grid-cols-2";
  const lgCols = desktopCols
    ? desktopCols === 4
      ? "lg:grid-cols-4"
      : desktopCols === 3
        ? "lg:grid-cols-3"
        : "lg:grid-cols-2"
    : "lg:" + baseCols;
  const gridClass = `grid ${baseCols} ${lgCols} gap-4`;
  return (
    <div className={gridClass}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} units={units} />
      ))}
    </div>
  );
}
