"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductGrid from "@/components/storefront/product/ProductGrid";
import AdvancedSearchBar from "@/components/storefront/search/AdvancedSearchBar";
import FilterDrawer from "@/components/storefront/search/FilterDrawer";
import MobileToolbar from "@/components/storefront/search/MobileToolbar";
import { getStorefrontProducts } from "@/lib/api/storefrontProducts";
import { getStorefrontCategoriesTree } from "@/lib/api/storefrontCategories";
import { getStorefrontBrands } from "@/lib/api/storefrontBrands";
import { LayoutGrid, Filter, ArrowUpDown, Check, X, ChevronDown } from "lucide-react";

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

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

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [brandIds, setBrandIds] = useState<string[]>(() => {
    const raw = searchParams.get("brand_id") || "";
    return raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  });
  const [inStock, setInStock] = useState<"" | "1" | "0">(() => {
    const v = (searchParams.get("in_stock") || "").trim();
    if (v === "1" || v === "0") return v;
    if (v === "true" || v === "yes" || v === "on") return "1";
    if (v === "false" || v === "no" || v === "off") return "0";
    return "";
  });
  const [sort, setSort] = useState(searchParams.get("sort") || "");
  const [min, setMin] = useState(searchParams.get("min") || "");
  const [max, setMax] = useState(searchParams.get("max") || "");

  const debouncedQ = useDebounced(q, 300);
  const debouncedMin = useDebounced(min, 300);
  const debouncedMax = useDebounced(max, 300);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({ data: [], current_page: 1, last_page: 1, total: 0 });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [cats, setCats] = useState<Cat[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [catsOpen, setCatsOpen] = useState(true);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [gridCols, setGridCols] = useState<1 | 2>(() => {
    const v = searchParams.get("grid");
    return v === "1" ? 1 : 2;
  });

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (debouncedQ.trim()) sp.set("q", debouncedQ.trim());
    if (category) sp.set("category", category);
    if (brandIds.length) sp.set("brand_id", brandIds.join(","));
    if (inStock) sp.set("in_stock", inStock);
    if (sort) sp.set("sort", sort);
    if (debouncedMin.trim()) sp.set("min", debouncedMin.trim());
    if (debouncedMax.trim()) sp.set("max", debouncedMax.trim());
    if (gridCols !== 2) sp.set("grid", String(gridCols));
    return sp.toString();
  }, [debouncedQ, category, brandIds, inStock, sort, debouncedMin, debouncedMax, gridCols]);

  useEffect(() => {
    router.replace(`/search${queryString ? `?${queryString}` : ""}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getStorefrontProducts({
          q: debouncedQ,
          category,
          brand_id: brandIds.length ? brandIds.join(",") : undefined,
          in_stock: inStock ? inStock : undefined,
          sort,
          min: debouncedMin,
          max: debouncedMax,
          per_page: 24,
        });
        if (mounted) setData(res);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [debouncedQ, category, brandIds, inStock, sort, debouncedMin, debouncedMax]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setFiltersLoading(true);
        const tree: any = await getStorefrontCategoriesTree();
        const flat = flattenTree(Array.isArray(tree) ? tree : tree?.data || tree?.categories || []);
        if (mounted) setCats(flat.filter((c) => c.slug));

        const b = await getStorefrontBrands();
        if (mounted) setBrands(b.map((x) => ({ id: x.id, name: x.name })));
      } finally {
        if (mounted) setFiltersLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleClearFilters = () => {
    setCategory("");
    setBrandIds([]);
    setInStock("");
    setMin("");
    setMax("");
    setSort("");
  };

  const handleCloseFilterDrawer = () => {
    setFilterDrawerOpen(false);
  };

  const sortOptions = useMemo(
    () => [
      { key: "", label: "Önerilen" },
      { key: "newest", label: "En yeni" },
      { key: "price_asc", label: "Fiyat artan" },
      { key: "price_desc", label: "Fiyat azalan" },
    ],
    []
  );

  const activeSortLabel = useMemo(() => {
    return sortOptions.find((o) => o.key === sort)?.label ?? "Sırala";
  }, [sort, sortOptions]);

  const selectedName = useMemo(() => cats.find((c) => c.slug === category)?.name, [cats, category]);

  const toggleBrand = (id: string) => {
    const next = brandIds.includes(id) ? brandIds.filter((x) => x !== id) : [...brandIds, id];
    setBrandIds(next);
  };

  const stockIn = inStock === "1";
  const stockOut = inStock === "0";

  const toggleStockIn = () => {
    const nextIn = !stockIn;
    if (nextIn && stockOut) {
      setInStock("");
      return;
    }
    setInStock(nextIn ? "1" : "");
  };

  const toggleStockOut = () => {
    const nextOut = !stockOut;
    if (nextOut && stockIn) {
      setInStock("");
      return;
    }
    setInStock(nextOut ? "0" : "");
  };

  return (
    <>
      <div className="container mx-auto px-4 pt-3 pb-6 lg:pt-6 lg:pb-8">
        <AdvancedSearchBar
          value={q}
          onChange={setQ}
          productCount={data?.total}
        />

        <div className="mt-6 lg:hidden">
          <MobileToolbar
            onToggleGrid={() => setGridCols((c) => (c === 2 ? 1 : 2))}
            onOpenFilter={() => setFilterDrawerOpen(true)}
            onOpenSort={() => setSortSheetOpen(true)}
          />

          {(category || brandIds.length > 0 || inStock || min || max || sort) && (
            <button
              type="button"
              onClick={() => {
                handleClearFilters();
                setGridCols(2);
              }}
              className="mt-3 text-sm font-medium text-gray-500 hover:text-gray-700 underline"
            >
              Filtreleri temizle
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-[120px]">
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y">
                <div>
                  <button
                    type="button"
                    onClick={() => setCatsOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700"
                  >
                    <span>Alt Kategoriler</span>
                    <ChevronDown className={"w-4 h-4 transition-transform " + (catsOpen ? "rotate-180" : "rotate-0")} />
                  </button>
                  {selectedName ? <div className="px-4 pb-2 text-xs text-gray-500">Seçili: {selectedName}</div> : null}
                  {catsOpen && (
                    <div className="px-4 pb-4 max-h-[380px] overflow-y-auto pr-1 space-y-1">
                      {filtersLoading ? (
                        <div className="text-sm text-gray-500 py-3">Yükleniyor...</div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setCategory("")}
                            className={
                              "w-full text-left px-3 py-2 rounded-lg text-sm " +
                              (category === "" ? "bg-primary/10 text-primary font-bold" : "hover:bg-gray-50")
                            }
                          >
                            Tümü
                          </button>
                          {cats.slice(0, 120).map((c) => (
                            <button
                              key={String(c.id)}
                              type="button"
                              onClick={() => setCategory(c.slug || "")}
                              className={
                                "w-full text-left px-3 py-2 rounded-lg text-sm " +
                                (category === c.slug ? "bg-primary/10 text-primary font-bold" : "hover:bg-gray-50")
                              }
                            >
                              {c.name}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setBrandsOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700"
                  >
                    <span>Markalar</span>
                    <ChevronDown className={"w-4 h-4 transition-transform " + (brandsOpen ? "rotate-180" : "rotate-0")} />
                  </button>
                  {brandsOpen && (
                    <div className="px-4 pb-4 space-y-2">
                      {brands.map((b) => {
                        const id = String(b.id);
                        const checked = brandIds.includes(id);
                        return (
                          <label key={b.id} className="flex items-center justify-between h-10 px-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
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
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setStockOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700"
                  >
                    <span>Stok Durumu</span>
                    <ChevronDown className={"w-4 h-4 transition-transform " + (stockOpen ? "rotate-180" : "rotate-0")} />
                  </button>
                  {stockOpen && (
                    <div className="px-4 pb-4 space-y-2">
                      <label className="flex items-center justify-between h-10 px-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                        <div className="text-sm font-medium text-gray-800">Stokta var</div>
                        <input
                          type="checkbox"
                          checked={stockIn}
                          onChange={toggleStockIn}
                          className="w-4 h-4 accent-primary"
                        />
                      </label>
                      <label className="flex items-center justify-between h-10 px-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                        <div className="text-sm font-medium text-gray-800">Stokta yok</div>
                        <input
                          type="checkbox"
                          checked={stockOut}
                          onChange={toggleStockOut}
                          className="w-4 h-4 accent-primary"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setPriceOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700"
                  >
                    <span>Fiyat</span>
                    <ChevronDown className={"w-4 h-4 transition-transform " + (priceOpen ? "rotate-180" : "rotate-0")} />
                  </button>
                  {priceOpen && (
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={min}
                          onChange={(e) => setMin(e.target.value)}
                          placeholder="Min ₺"
                          inputMode="decimal"
                          className="w-full h-10 bg-[#f1f5f9] border border-transparent rounded-lg px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/20 outline-none"
                        />
                        <input
                          value={max}
                          onChange={(e) => setMax(e.target.value)}
                          placeholder="Max ₺"
                          inputMode="decimal"
                          className="w-full h-10 bg-[#f1f5f9] border border-transparent rounded-lg px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/20 outline-none"
                        />
                      </div>
                      {(category || brandIds.length > 0 || inStock || min || max || sort) && (
                        <button
                          type="button"
                          onClick={() => {
                            handleClearFilters();
                            setGridCols(2);
                          }}
                          className="mt-3 text-xs font-semibold text-gray-500 hover:text-gray-700 underline"
                        >
                          Filtreleri temizle
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          <div>
            {loading ? (
              <div className="text-sm text-gray-500">Yükleniyor...</div>
            ) : data?.data?.length ? (
              <ProductGrid products={data.data} cols={gridCols} desktopCols={4} />
            ) : (
              <div className="text-sm text-gray-500">Sonuç bulunamadı.</div>
            )}
          </div>
        </div>
      </div>

      <FilterDrawer
        open={filterDrawerOpen}
        selectedCategory={category}
        brandIds={brandIds}
        inStock={inStock}
        min={min}
        max={max}
        total={data?.total || 0}
        onClose={handleCloseFilterDrawer}
        onChangeCategory={setCategory}
        onBrandIds={setBrandIds}
        onInStock={setInStock}
        onMin={setMin}
        onMax={setMax}
        onClear={handleClearFilters}
      />

      <div className={sortSheetOpen ? "fixed inset-0 z-[220]" : "hidden"}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setSortSheetOpen(false)} />
        <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl p-4">
          <div className="flex items-center justify-between h-12">
            <div className="text-lg font-extrabold">Sırala</div>
            <button
              type="button"
              onClick={() => setSortSheetOpen(false)}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-2 space-y-2 pb-2">
            {sortOptions.map((o) => {
              const active = o.key === sort;
              return (
                <button
                  key={o.key || "default"}
                  type="button"
                  onClick={() => {
                    setSort(o.key);
                    setSortSheetOpen(false);
                  }}
                  className={
                    "w-full h-12 rounded-2xl px-4 flex items-center justify-between border transition-colors " +
                    (active ? "border-primary bg-primary/5" : "border-gray-200 hover:bg-gray-50")
                  }
                >
                  <div className={active ? "font-bold text-primary" : "font-semibold text-gray-900"}>{o.label}</div>
                  {active ? (
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Check className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
