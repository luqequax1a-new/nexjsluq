"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductGrid from "@/components/storefront/product/ProductGrid";
import FilterDrawer from "@/components/storefront/search/FilterDrawer";
import { getStorefrontProducts } from "@/lib/api/storefrontProducts";
import { getStorefrontCategoriesTree } from "@/lib/api/storefrontCategories";
import { getStorefrontBrands } from "@/lib/api/storefrontBrands";
import { getCategoryData } from "@/lib/api/storefront";
import { LayoutGrid, Filter, ArrowUpDown, Check, X, ChevronDown, ChevronRight, Minus, Plus } from "lucide-react";

type Cat = { id: number | string; name: string; slug?: string; children?: Cat[] };

type CategoryDetail = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  faq_items?: Array<{ question: string; answer: string }>;
  image?: string;
  meta_title?: string;
  meta_description?: string;
};

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

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* ── Sidebar filter section header ── */
function FilterSection({ title, count, open, onToggle, children }: {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-semibold text-gray-900 uppercase tracking-wide hover:bg-gray-50/50"
      >
        <span className="flex items-center gap-2">
          {title}
          {count !== undefined && count > 0 && (
            <span className="text-[10px] font-bold bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center">
              {count}
            </span>
          )}
        </span>
        {open ? <Minus className="w-3.5 h-3.5 text-gray-400" /> : <Plus className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export default function CategoryPageClient({ categorySlug }: { categorySlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(categorySlug || "");
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
  const [page, setPage] = useState(() => {
    const v = Number(searchParams.get("page") || 1);
    return Number.isFinite(v) && v > 0 ? v : 1;
  });

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
  const [brandsOpen, setBrandsOpen] = useState(true);
  const [stockOpen, setStockOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [gridCols, setGridCols] = useState<1 | 2>(() => {
    const v = searchParams.get("grid");
    return v === "1" ? 1 : 2;
  });
  const [categoryDetail, setCategoryDetail] = useState<CategoryDetail | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  useEffect(() => {
    if (categorySlug && category !== categorySlug) {
      setCategory(categorySlug);
    }
  }, [categorySlug]);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (debouncedQ.trim()) sp.set("q", debouncedQ.trim());
    if (brandIds.length) sp.set("brand_id", brandIds.join(","));
    if (inStock) sp.set("in_stock", inStock);
    if (sort) sp.set("sort", sort);
    if (debouncedMin.trim()) sp.set("min", debouncedMin.trim());
    if (debouncedMax.trim()) sp.set("max", debouncedMax.trim());
    if (gridCols !== 2) sp.set("grid", String(gridCols));
    if (page > 1) sp.set("page", String(page));
    return sp.toString();
  }, [debouncedQ, brandIds, inStock, sort, debouncedMin, debouncedMax, gridCols, page]);

  useEffect(() => {
    if (category && category.trim()) {
      const basePath = `/kategoriler/${category}`;
      router.replace(`${basePath}${queryString ? `?${queryString}` : ""}`);
    } else if (debouncedQ.trim()) {
      router.replace(`/search${queryString ? `?${queryString}` : ""}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString, category]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCategoryLoading(true);
        const res: any = await getCategoryData(categorySlug);
        if (mounted && res?.category) {
          setCategoryDetail(res.category);
        }
      } catch {
        // silent
      } finally {
        if (mounted) setCategoryLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [categorySlug]);

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
          page,
          per_page: 24,
        });
        if (mounted) setData(res);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [debouncedQ, category, brandIds, inStock, sort, debouncedMin, debouncedMax, page]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setFiltersLoading(true);
        const tree = await getStorefrontCategoriesTree();
        const flat = flattenTree(Array.isArray(tree) ? tree : (tree as any)?.data || (tree as any)?.categories || []);
        if (mounted) setCats(flat.filter((c) => c.slug));

        const b = await getStorefrontBrands();
        if (mounted) setBrands(b.map((x) => ({ id: x.id, name: x.name })));
      } finally {
        if (mounted) setFiltersLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleClearFilters = () => {
    setBrandIds([]);
    setInStock("");
    setMin("");
    setMax("");
    setSort("");
    setPage(1);
  };

  const hasActiveFilters = brandIds.length > 0 || inStock !== "" || min !== "" || max !== "" || sort !== "";

  const sortOptions = useMemo(
    () => [
      { key: "", label: "Önerilen" },
      { key: "newest", label: "En yeni" },
      { key: "price_asc", label: "Fiyat: Düşükten Yükseğe" },
      { key: "price_desc", label: "Fiyat: Yüksekten Düşüğe" },
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
    setPage(1);
  };

  const stockIn = inStock === "1";
  const stockOut = inStock === "0";

  const toggleStockIn = () => {
    setInStock(stockIn ? "" : "1");
    setPage(1);
  };

  const toggleStockOut = () => {
    setInStock(stockOut ? "" : "0");
    setPage(1);
  };

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortDropdownOpen) return;
    const handler = () => setSortDropdownOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [sortDropdownOpen]);

  return (
    <>
      {/* ── Container: ikas style max-w-[1440px] ── */}
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 32px" }}>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: "/" },
                { "@type": "ListItem", position: 2, name: selectedName || categoryDetail?.name || "Kategori", item: `/kategoriler/${category}` },
              ],
            }),
          }}
        />

        {/* Breadcrumb */}
        <nav className="py-3 text-sm text-gray-500 flex items-center gap-1.5">
          <a href="/" className="hover:text-black transition-colors">Ana Sayfa</a>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-black font-medium">{categoryDetail?.name || selectedName || "Kategori"}</span>
        </nav>

        {/* ── MAIN GRID: sidebar(250px) + content(1fr) ── */}
        <div
          className="hidden lg:grid mb-8"
          style={{ gridTemplateColumns: "280px 1fr", gap: 32, alignItems: "start" }}
        >
          {/* ══════════════════════════════════════════════ */}
          {/* LEFT SIDEBAR — sticky filter                  */}
          {/* ══════════════════════════════════════════════ */}
          <div
            className="sticky-filter"
            style={{
              position: "sticky",
              top: 100,
              alignSelf: "start",
              maxHeight: "calc(100vh - 120px)",
              overflowY: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* Categories */}
            <FilterSection title="KATEGORİLER" open={catsOpen} onToggle={() => setCatsOpen((v) => !v)}>
              {filtersLoading ? (
                <div className="text-xs text-gray-400 py-2">Yükleniyor...</div>
              ) : (
                <div className="space-y-0.5 max-h-[45vh] overflow-y-auto pr-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {cats.map((c) => {
                    const isActive = category === c.slug;
                    return (
                      <button
                        key={String(c.id)}
                        type="button"
                        onClick={() => { setCategory(c.slug || ""); setPage(1); }}
                        className={
                          "w-full text-left px-2 py-[6px] text-[13px] leading-tight " +
                          (isActive
                            ? "text-black font-bold"
                            : "text-gray-500 hover:text-black")
                        }
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </FilterSection>

            {/* Brands */}
            {brands.length > 0 && (
              <FilterSection title="MARKALAR" count={brandIds.length} open={brandsOpen} onToggle={() => setBrandsOpen((v) => !v)}>
                <div className="space-y-1 max-h-[35vh] overflow-y-auto pr-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {brands.map((b) => {
                    const id = String(b.id);
                    const checked = brandIds.includes(id);
                    return (
                      <label key={b.id} className="flex items-center gap-2.5 py-[3px] cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleBrand(id)}
                          className="w-[15px] h-[15px] rounded-sm border-gray-300 text-black accent-black cursor-pointer"
                        />
                        <span className={"text-[13px] " + (checked ? "text-black font-medium" : "text-gray-500 group-hover:text-black")}>{b.name}</span>
                      </label>
                    );
                  })}
                </div>
              </FilterSection>
            )}

            {/* Stock */}
            <FilterSection title="STOK DURUMU" open={stockOpen} onToggle={() => setStockOpen((v) => !v)}>
              <div className="space-y-1">
                <label className="flex items-center gap-2.5 py-[3px] cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={stockIn}
                    onChange={toggleStockIn}
                    className="w-[15px] h-[15px] rounded-sm border-gray-300 text-black accent-black cursor-pointer"
                  />
                  <span className={"text-[13px] " + (stockIn ? "text-black font-medium" : "text-gray-500 group-hover:text-black")}>Stokta Var</span>
                </label>
                <label className="flex items-center gap-2.5 py-[3px] cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={stockOut}
                    onChange={toggleStockOut}
                    className="w-[15px] h-[15px] rounded-sm border-gray-300 text-black accent-black cursor-pointer"
                  />
                  <span className={"text-[13px] " + (stockOut ? "text-black font-medium" : "text-gray-500 group-hover:text-black")}>Stokta Yok</span>
                </label>
              </div>
            </FilterSection>

            {/* Price */}
            <FilterSection title="FİYAT ARALIĞI" open={priceOpen} onToggle={() => setPriceOpen((v) => !v)}>
              <div className="flex items-center gap-2">
                <input
                  value={min}
                  onChange={(e) => { setMin(e.target.value); setPage(1); }}
                  placeholder="₺ Min"
                  inputMode="decimal"
                  className="w-full h-8 px-2 bg-gray-50 border border-gray-200 text-[13px] focus:border-gray-400 focus:bg-white outline-none"
                />
                <span className="text-gray-300 text-xs">—</span>
                <input
                  value={max}
                  onChange={(e) => { setMax(e.target.value); setPage(1); }}
                  placeholder="₺ Max"
                  inputMode="decimal"
                  className="w-full h-8 px-2 bg-gray-50 border border-gray-200 text-[13px] focus:border-gray-400 focus:bg-white outline-none"
                />
              </div>
            </FilterSection>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="py-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full text-[12px] font-semibold text-red-600 hover:text-red-700 transition-colors"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════ */}
          {/* RIGHT: Content area                           */}
          {/* ══════════════════════════════════════════════ */}
          <div className="min-w-0">
            {/* Page Header */}
            <div className="flex items-end justify-between mb-5">
              <div>
                <h1 className="text-[32px] font-bold text-black leading-[38px]">
                  {categoryDetail?.name || selectedName || "Kategori"}
                  <span className="text-[15px] font-medium text-gray-400 ml-2">({data?.total ?? 0} Ürün)</span>
                </h1>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSortDropdownOpen((v) => !v); }}
                  className="h-9 px-4 flex items-center gap-2 border border-gray-200 text-[13px] font-medium text-gray-700 hover:border-gray-400 transition-colors"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  {activeSortLabel}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {sortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 shadow-lg z-50 py-1">
                    {sortOptions.map((o) => (
                      <button
                        key={o.key || "default"}
                        onClick={(e) => { e.stopPropagation(); setSort(o.key); setSortDropdownOpen(false); setPage(1); }}
                        className={
                          "w-full px-4 py-2.5 text-left text-[13px] hover:bg-gray-50 " +
                          (sort === o.key ? "text-black font-semibold bg-gray-50" : "text-gray-600")
                        }
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {brandIds.map((bid) => {
                  const brand = brands.find((b) => String(b.id) === bid);
                  return brand ? (
                    <span key={bid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-medium">
                      {brand.name}
                      <button type="button" onClick={() => toggleBrand(bid)} className="ml-0.5 hover:text-black"><X className="w-3 h-3" /></button>
                    </span>
                  ) : null;
                })}
                {inStock === "1" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-medium">
                    Stokta Var
                    <button type="button" onClick={() => setInStock("")} className="ml-0.5 hover:text-black"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {inStock === "0" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-medium">
                    Stokta Yok
                    <button type="button" onClick={() => setInStock("")} className="ml-0.5 hover:text-black"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {(min || max) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-medium">
                    ₺{min || "0"} — ₺{max || "∞"}
                    <button type="button" onClick={() => { setMin(""); setMax(""); }} className="ml-0.5 hover:text-black"><X className="w-3 h-3" /></button>
                  </span>
                )}
                <button type="button" onClick={handleClearFilters} className="text-[11px] font-semibold text-red-600 hover:text-red-700 px-1">
                  Tümünü Temizle
                </button>
              </div>
            )}

            {/* Product Grid */}
            <div className="min-h-[400px]">
              {loading ? (
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : data?.data?.length ? (
                <>
                  <ProductGrid products={data.data} cols={gridCols} desktopCols={4} />

                  {/* Pagination */}
                  {data?.last_page > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={data?.current_page <= 1}
                        className="h-9 px-3 border border-gray-200 text-[13px] font-medium text-gray-700 disabled:opacity-30 hover:bg-gray-50"
                      >
                        Önceki
                      </button>
                      {Array.from({ length: Math.min(data.last_page, 7) }, (_, i) => {
                        let pageNum: number;
                        const total = data.last_page;
                        const current = data.current_page;
                        if (total <= 7) {
                          pageNum = i + 1;
                        } else if (current <= 4) {
                          pageNum = i + 1;
                        } else if (current >= total - 3) {
                          pageNum = total - 6 + i;
                        } else {
                          pageNum = current - 3 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setPage(pageNum)}
                            className={
                              "w-9 h-9 text-[13px] font-medium " +
                              (pageNum === current
                                ? "bg-black text-white"
                                : "text-gray-600 hover:bg-gray-50 border border-gray-200")
                            }
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(data?.last_page || p, p + 1))}
                        disabled={data?.current_page >= data?.last_page}
                        className="h-9 px-3 border border-gray-200 text-[13px] font-medium text-gray-700 disabled:opacity-30 hover:bg-gray-50"
                      >
                        Sonraki
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-16 text-center">
                  <p className="text-gray-500 font-medium mb-1">Ürün bulunamadı</p>
                  <p className="text-sm text-gray-400 mb-4">Aradığınız kriterlere uygun ürün bulunmamaktadır.</p>
                  {hasActiveFilters && (
                    <button onClick={handleClearFilters} className="text-sm font-semibold text-primary hover:underline">Filtreleri Temizle</button>
                  )}
                </div>
              )}
            </div>

            {/* ── Description & FAQ ── */}
            {(categoryDetail?.description || (categoryDetail?.faq_items && categoryDetail.faq_items.length > 0)) && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                {categoryDetail?.description && (
                  <div>
                    <h2 className="text-lg font-bold text-black mb-3">
                      {categoryDetail.name} Hakkında
                    </h2>
                    <div
                      className="prose prose-sm max-w-none text-gray-600 leading-relaxed prose-headings:text-black prose-headings:font-semibold prose-p:mb-3 prose-strong:text-gray-800"
                      dangerouslySetInnerHTML={{ __html: categoryDetail.description }}
                    />
                  </div>
                )}

                {categoryDetail?.faq_items && categoryDetail.faq_items.length > 0 && (
                  <div className={categoryDetail?.description ? "mt-8" : ""}>
                    <h2 className="text-lg font-bold text-black mb-3">Sıkça Sorulan Sorular</h2>
                    <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
                      {categoryDetail.faq_items.map((faq, index) => {
                        const isOpen = openFaqIndex === index;
                        return (
                          <div key={index}>
                            <button
                              type="button"
                              onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                              className="w-full flex items-center justify-between py-4 text-left"
                            >
                              <span className="text-sm font-semibold text-black pr-4">{faq.question}</span>
                              <ChevronDown className={"w-4 h-4 text-gray-400 flex-shrink-0 transition-transform " + (isOpen ? "rotate-180" : "")} />
                            </button>
                            {isOpen && (
                              <div className="pb-4 text-sm text-gray-600 leading-relaxed">
                                <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE LAYOUT (< lg) ── */}
        <div className="lg:hidden pb-8">
          {/* Mobile Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-black leading-tight">
              {categoryDetail?.name || selectedName || "Kategori"}
              <span className="text-[13px] font-medium text-gray-400 ml-1.5">({data?.total ?? 0} Ürün)</span>
            </h1>
          </div>

          {/* Mobile Actions */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="flex-1 h-10 flex items-center justify-center gap-2 bg-white border border-gray-200 text-sm font-medium text-gray-700"
            >
              <Filter className="w-4 h-4" />
              Filtrele
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary ml-1" />}
            </button>
            <button
              type="button"
              onClick={() => setSortSheetOpen(true)}
              className="flex-1 h-10 flex items-center justify-center gap-2 bg-white border border-gray-200 text-sm font-medium text-gray-700"
            >
              <ArrowUpDown className="w-4 h-4" />
              {activeSortLabel}
            </button>
            <button
              type="button"
              onClick={() => setGridCols((c) => (c === 2 ? 1 : 2))}
              className="h-10 w-10 flex items-center justify-center bg-white border border-gray-200"
            >
              <LayoutGrid className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Mobile Product Grid */}
          <div className="min-h-[300px]">
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : data?.data?.length ? (
              <>
                <ProductGrid products={data.data} cols={gridCols} desktopCols={4} />
                {data?.last_page > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={data?.current_page <= 1}
                      className="h-9 px-3 border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-30"
                    >
                      Önceki
                    </button>
                    <div className="h-9 px-3 flex items-center text-sm font-bold text-black">
                      {data?.current_page} / {data?.last_page}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(data?.last_page || p, p + 1))}
                      disabled={data?.current_page >= data?.last_page}
                      className="h-9 px-3 border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-30"
                    >
                      Sonraki
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500 font-medium">Ürün bulunamadı</p>
              </div>
            )}
          </div>

          {/* Mobile Description & FAQ */}
          {(categoryDetail?.description || (categoryDetail?.faq_items && categoryDetail.faq_items.length > 0)) && (
            <div className="mt-10 pt-6 border-t border-gray-200">
              {categoryDetail?.description && (
                <div>
                  <h2 className="text-base font-bold text-black mb-2">{categoryDetail.name} Hakkında</h2>
                  <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: categoryDetail.description }} />
                </div>
              )}
              {categoryDetail?.faq_items && categoryDetail.faq_items.length > 0 && (
                <div className={categoryDetail?.description ? "mt-6" : ""}>
                  <h2 className="text-base font-bold text-black mb-2">Sıkça Sorulan Sorular</h2>
                  <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
                    {categoryDetail.faq_items.map((faq, index) => {
                      const isOpen = openFaqIndex === index;
                      return (
                        <div key={index}>
                          <button type="button" onClick={() => setOpenFaqIndex(isOpen ? null : index)} className="w-full flex items-center justify-between py-3 text-left">
                            <span className="text-sm font-semibold text-black pr-4">{faq.question}</span>
                            <ChevronDown className={"w-4 h-4 text-gray-400 flex-shrink-0 " + (isOpen ? "rotate-180" : "")} />
                          </button>
                          {isOpen && <div className="pb-3 text-sm text-gray-600 leading-relaxed"><div dangerouslySetInnerHTML={{ __html: faq.answer }} /></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        open={filterDrawerOpen}
        selectedCategory={category}
        brandIds={brandIds}
        inStock={inStock}
        min={min}
        max={max}
        total={data?.total || 0}
        onClose={() => setFilterDrawerOpen(false)}
        onChangeCategory={setCategory}
        onBrandIds={setBrandIds}
        onInStock={setInStock}
        onMin={setMin}
        onMax={setMax}
        onClear={handleClearFilters}
      />

      {/* Mobile Sort Sheet */}
      {sortSheetOpen && (
        <div className="fixed inset-0 z-[220]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSortSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-base font-bold text-black">Sıralama</span>
              <button type="button" onClick={() => setSortSheetOpen(false)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-2 pb-6">
              {sortOptions.map((o) => {
                const active = o.key === sort;
                return (
                  <button
                    key={o.key || "default"}
                    type="button"
                    onClick={() => { setSort(o.key); setSortSheetOpen(false); setPage(1); }}
                    className={
                      "w-full px-5 py-3 flex items-center justify-between text-sm " +
                      (active ? "text-black font-semibold bg-gray-50" : "text-gray-600 hover:bg-gray-50")
                    }
                  >
                    {o.label}
                    {active && <Check className="w-4 h-4 text-black" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
