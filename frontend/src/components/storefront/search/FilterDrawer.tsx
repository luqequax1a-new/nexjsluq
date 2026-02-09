"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStorefrontCategoriesTree } from "@/lib/api/storefrontCategories";
import { getStorefrontBrands } from "@/lib/api/storefrontBrands";

type Cat = { id: number | string; name: string; slug?: string; children?: Cat[] };

function flattenTree(nodes: any[]): Cat[] {
  const out: Cat[] = [];
  const walk = (arr: any[]) => {
    arr.forEach((n) => {
      out.push({ id: n.id, name: n.name, slug: n.slug, children: n.children });
      if (Array.isArray(n.children) && n.children.length) walk(n.children);
    });
  };
  walk(nodes || []);
  return out;
}

export default function FilterDrawer({
  open,
  selectedCategory,
  brandIds,
  inStock,
  min,
  max,
  total,
  onClose,
  onChangeCategory,
  onBrandIds,
  onInStock,
  onMin,
  onMax,
  onClear,
}: {
  open: boolean;
  selectedCategory: string;
  brandIds: string[];
  inStock: "" | "1" | "0";
  min: string;
  max: string;
  total: number;
  onClose: () => void;
  onChangeCategory: (slug: string) => void;
  onBrandIds: (ids: string[]) => void;
  onInStock: (v: "" | "1" | "0") => void;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  onClear: () => void;
}) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [catsOpen, setCatsOpen] = useState(true);
  const [brandsOpen, setBrandsOpen] = useState(true);
  const [stockOpen, setStockOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  const toggleBrand = (id: string) => {
    const next = brandIds.includes(id) ? brandIds.filter((x) => x !== id) : [...brandIds, id];
    onBrandIds(next);
  };

  const stockIn = inStock === "1";
  const stockOut = inStock === "0";

  const toggleStockIn = () => {
    const nextIn = !stockIn;
    if (nextIn && stockOut) {
      onInStock("");
      return;
    }
    onInStock(nextIn ? "1" : "");
  };

  const toggleStockOut = () => {
    const nextOut = !stockOut;
    if (nextOut && stockIn) {
      onInStock("");
      return;
    }
    onInStock(nextOut ? "0" : "");
  };

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const tree = (await getStorefrontCategoriesTree()) as any;
        const flat = flattenTree(Array.isArray(tree) ? tree : tree?.data || tree?.categories || []);
        if (mounted) setCats(flat.filter((c) => c.slug));

        const b = await getStorefrontBrands();
        if (mounted) setBrands(b.map((x) => ({ id: x.id, name: x.name })));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open]);

  const selectedName = useMemo(() => cats.find((c) => c.slug === selectedCategory)?.name, [cats, selectedCategory]);

  return (
    <div className={cn("fixed inset-0 z-[1200] lg:hidden", open ? "visible" : "invisible pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "absolute inset-y-0 right-0 w-[88vw] max-w-[420px] bg-white shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="text-lg font-extrabold">Filtrele</div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 active:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="h-[calc(100%-56px-88px)] overflow-y-auto p-4 space-y-6">
          <div className="border-b pb-4">
            <button
              type="button"
              onClick={() => setCatsOpen((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div>
                <div className="font-bold">Alt Kategoriler</div>
                {selectedName ? <div className="text-xs text-gray-500 mt-1">Seçili: {selectedName}</div> : null}
              </div>
              <ChevronDown className={cn("w-5 h-5 text-gray-500 transition-transform", catsOpen ? "rotate-180" : "rotate-0")} />
            </button>

            {catsOpen ? (
              <div className="mt-3 max-h-[45vh] overflow-y-auto pr-2">
                {loading ? (
                  <div className="text-sm text-gray-500 py-3">Yükleniyor...</div>
                ) : (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => onChangeCategory("")}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm",
                        selectedCategory === "" ? "bg-primary/10 text-primary font-bold" : "hover:bg-gray-50"
                      )}
                    >
                      Tümü
                    </button>
                    {cats.slice(0, 80).map((c) => (
                      <button
                        key={String(c.id)}
                        type="button"
                        onClick={() => onChangeCategory(c.slug || "")}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm",
                          selectedCategory === c.slug ? "bg-primary/10 text-primary font-bold" : "hover:bg-gray-50"
                        )}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="border-b pb-4">
            <button
              type="button"
              onClick={() => setBrandsOpen((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div>
                <div className="font-bold">Markalar</div>
                {brandIds.length ? <div className="text-xs text-gray-500 mt-1">Seçili: {brandIds.length}</div> : null}
              </div>
              <ChevronDown className={cn("w-5 h-5 text-gray-500 transition-transform", brandsOpen ? "rotate-180" : "rotate-0")} />
            </button>

            {brandsOpen ? (
              <div className="mt-3 space-y-2">
                {brands.map((b) => {
                  const id = String(b.id);
                  const checked = brandIds.includes(id);
                  return (
                    <label key={b.id} className="flex items-center justify-between h-11 px-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                      <div className="text-sm font-medium text-gray-800">{b.name}</div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBrand(id)}
                        className="w-4 h-4 accent-primary"
                      />
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="border-b pb-4">
            <button
              type="button"
              onClick={() => setStockOpen((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div>
                <div className="font-bold">Stok Durumu</div>
                {inStock ? <div className="text-xs text-gray-500 mt-1">Seçili: {inStock === "1" ? "Var" : "Yok"}</div> : null}
              </div>
              <ChevronDown className={cn("w-5 h-5 text-gray-500 transition-transform", stockOpen ? "rotate-180" : "rotate-0")} />
            </button>

            {stockOpen ? (
              <div className="mt-3 space-y-2">
                <label className="flex items-center justify-between h-11 px-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm font-medium text-gray-800">Stokta var</div>
                  <input
                    type="checkbox"
                    checked={stockIn}
                    onChange={toggleStockIn}
                    className="w-4 h-4 accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between h-11 px-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                  <div className="text-sm font-medium text-gray-800">Stokta yok</div>
                  <input
                    type="checkbox"
                    checked={stockOut}
                    onChange={toggleStockOut}
                    className="w-4 h-4 accent-primary"
                  />
                </label>
                <div className="text-xs text-gray-500">
                  İkisini birden seçersen filtre uygulanmaz.
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-b pb-4">
            <button
              type="button"
              onClick={() => setPriceOpen((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div>
                <div className="font-bold">Fiyat</div>
                {min || max ? <div className="text-xs text-gray-500 mt-1">Seçili: {min || "-"} / {max || "-"}</div> : null}
              </div>
              <ChevronDown className={cn("w-5 h-5 text-gray-500 transition-transform", priceOpen ? "rotate-180" : "rotate-0")} />
            </button>

            {priceOpen ? (
              <>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <input
                    value={min}
                    onChange={(e) => onMin(e.target.value)}
                    placeholder="Min ₺"
                    inputMode="decimal"
                    className="w-full h-11 bg-[#f1f5f9] border border-transparent rounded-lg px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/20 outline-none"
                  />
                  <input
                    value={max}
                    onChange={(e) => onMax(e.target.value)}
                    placeholder="Max ₺"
                    inputMode="decimal"
                    className="w-full h-11 bg-[#f1f5f9] border border-transparent rounded-lg px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/20 outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={onClear}
                  className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Filtreleri temizle
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="h-[88px] border-t bg-white p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-md bg-primary text-white font-extrabold hover:bg-primary/90 active:bg-primary/80"
          >
            {total} ÜRÜNÜ GÖR
          </button>
        </div>
      </div>
    </div>
  );
}
