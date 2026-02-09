"use client";

import { App, Button, Space, Table, Popover, Tag as AntTag, Select } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth, hasPermission } from "@/lib/auth";
import type { MediaItem } from "@/types/media";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { DeleteOutlined, EditOutlined, ExportOutlined, EyeOutlined, ImportOutlined, PlusOutlined, SearchOutlined, FilterOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { usePageHeader } from "@/hooks/usePageHeader";
import { QuickEditDrawers } from "@/components/admin/product/QuickEditDrawers";
import { BulkEditModal } from "@/components/admin/product/BulkEditModal";
import { t } from "@/lib/i18n";

dayjs.locale("tr");

type ProductUnit = {
  type: string | null;
  label?: string;
  suffix?: string;
  is_decimal_stock?: boolean;
  min?: number;
  step?: number;
  price_prefix?: string;
  stock_prefix?: string;
};

type Variant = {
  id: number;
  price: number | string;
  discount_price?: number | string;
  selling_price?: number | string;
  qty?: number;
  allow_backorder?: number | boolean;
  in_stock?: number | boolean;
  is_active?: number | boolean;
  is_default?: number | boolean;
  media?: MediaItem[];
  medias?: MediaItem[];
};

type Product = {
  id: number;
  name: string;
  slug?: string | null;
  sku: string;
  price: string | number;
  discount_price?: string | number;
  selling_price?: string | number;
  qty: number;
  status: "published" | "draft";
  created_at: string;
  updated_at?: string;
  media?: MediaItem[];
  brand?: { name: string };
  categories?: { name: string; pivot: { is_primary: number } }[];
  variants?: Variant[];
  allow_backorder?: boolean;
  in_stock?: boolean;
  unit?: ProductUnit;
  is_active?: boolean;
};

export default function ProductsPage() {
  const { message, modal } = App.useApp();
  const { me } = useAuth();
  const [data, setData] = useState<{ data: Product[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuickEdit, setActiveQuickEdit] = useState<{ id: number; type: "inventory" | "pricing" } | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const reloadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Product[]; total: number }>("/api/products");
      setData(res);
    } catch (e: any) {
      message.error(t('admin.products.list.load_failed', 'Ürünler yüklenemedi') + ": " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: t("admin.common.confirm_delete", "Silmek istediğinize emin misiniz?"),
      content: t("admin.common.irreversible", "Bu işlem geri alınamaz."),
      okText: t("admin.common.yes", "Evet"),
      okType: "danger",
      cancelText: t("admin.common.cancel", "Vazgeç"),
      onOk: async () => {
        try {
          await apiFetch(`/api/products/${id}`, { method: "DELETE" });
          message.success(t('admin.product.form.delete_success', 'Ürün silindi'));
          void reloadData();
        } catch (e: any) {
          message.error(t('admin.product.form.delete_failed', 'Silme işlemi başarısız') + ": " + e.message);
        }
      }
    });
  };

  const headerExtra = useMemo(() => (
    <Space size={12}>
      <Button
        icon={<ExportOutlined />}
        style={{ borderRadius: 8, fontWeight: 500 }}
      >
        {t("admin.products.list.export", "Dışa Aktar")}
      </Button>
      <Button
        icon={<ImportOutlined />}
        style={{ borderRadius: 8, fontWeight: 500 }}
      >
        {t("admin.products.list.import", "İçe Aktar")}
      </Button>
      {hasPermission(me, "products.create") && (
        <Link href="/admin/product/new">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: "#5E5CE6", borderColor: "#5E5CE6", borderRadius: 8, fontWeight: 600, padding: "0 20px" }}
          >
            {t("admin.products.list.new_product", "Yeni Ürün")}
          </Button>
        </Link>
      )}
    </Space>
  ), [me]);

  const headerFooter = useMemo(() => (
    <div style={{ display: "flex", gap: "24px", color: "#64748b", fontSize: "13px" }}>
      <span>{t("admin.products.list.total", "Toplam :count ürün").replace(":count", (data?.total || 0).toString())}</span>
      <span>|</span>
      <span>{t('admin.products.list.filter_all', 'Filtre: Tümü')}</span>
    </div>
  ), [data]);

  usePageHeader({
    title: t("admin.products.list.title", "Ürünler"),
    extra: headerExtra,
    footer: headerFooter
  });

  useEffect(() => {
    void reloadData();
  }, [message]);

  const resolvePublicUrl = (path: string) => {
    if (!path) return "";
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const normalized = path.startsWith("/") ? path.slice(1) : path;
    return `${base}/storage/${normalized}`;
  };

  const formatCurrencyValue = (val: number | string | undefined | null) => {
    if (val === undefined || val === null) return "0";
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(val));
  };

  const resolvePriceSuffix = (u?: ProductUnit | null) => {
    const s = (u?.price_prefix ?? '').toString().trim();
    return s ? ` ${s}` : '';
  };

  const resolveStockSuffix = (u?: ProductUnit | null) => {
    const raw = (u?.stock_prefix ?? u?.suffix ?? u?.label ?? '').toString().trim();
    return raw ? ` ${raw}` : ` ${t('admin.product.form.unit.piece', 'adet')}`;
  };

  const formatStockNumber = (qty: number, isDecimal: boolean) => {
    if (!isDecimal) return Math.round(qty).toString();
    return Number(qty).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: (Number.isInteger(Number(qty)) ? 0 : 2) });
  };

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return data?.data ?? [];
    const q = searchText.toLowerCase();
    return (data?.data ?? []).filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
    );
  }, [data, searchText]);

  // Pagination
  const totalFiltered = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const rangeStart = totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalFiltered);

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1); }, [searchText]);

  const hasSelection = selectedRowKeys.length > 0;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ─── Toolbar: matches Image 2 exactly ─── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
      }}>
        {/* Selection actions — bordered pill group */}
        {hasSelection && (
          <div style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            overflow: "hidden",
            background: "#fff",
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: 13, fontWeight: 500, color: "#333",
              padding: "7px 14px",
              borderRight: "1px solid #e5e7eb",
              whiteSpace: "nowrap",
            }}>
              {selectedRowKeys.length} ürün seçildi
            </span>
            <button
              onClick={() => setBulkEditOpen(true)}
              className="toolbar-btn"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 500, color: "#333",
                padding: "7px 14px",
                borderRight: "1px solid #e5e7eb",
                whiteSpace: "nowrap",
              }}
            >
              Düzenle
            </button>
            <button
              onClick={() => {
                modal.confirm({
                  title: t('admin.common.confirm_delete', 'Silmek istediğinize emin misiniz?'),
                  content: t('admin.products.list.bulk_delete_confirm', ':count ürün silinecek. Bu işlem geri alınamaz.').replace(':count', selectedRowKeys.length.toString()),
                  okText: t('admin.common.yes', 'Evet'),
                  okType: 'danger',
                  cancelText: t('admin.common.cancel', 'Vazgeç'),
                  onOk: async () => {
                    try {
                      await Promise.all(selectedRowKeys.map(id => apiFetch(`/api/products/${id}`, { method: 'DELETE' })));
                      message.success(t('admin.products.list.bulk_delete_success', 'Seçili ürünler silindi'));
                      setSelectedRowKeys([]);
                      void reloadData();
                    } catch (e: any) {
                      message.error(t('admin.products.list.bulk_delete_failed', 'Toplu silme başarısız') + ': ' + e.message);
                    }
                  },
                });
              }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, color: "#ef4444",
                padding: "7px 14px",
                whiteSpace: "nowrap",
              }}
            >
              Sil
            </button>
          </div>
        )}

        {/* Search — bordered */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "7px 14px",
          flex: 1,
          maxWidth: 300,
        }}>
          <SearchOutlined style={{ color: "#bbb", fontSize: 14 }} />
          <input
            type="text"
            placeholder="Tabloda arama yapın"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              border: "none", outline: "none", background: "transparent",
              fontSize: 13, color: "#333", width: "100%",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Filtre — bordered */}
        <button
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
            padding: "7px 14px", fontSize: 13, fontWeight: 500, color: "#333",
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          <FilterOutlined style={{ fontSize: 13 }} />
          Filtre
        </button>
      </div>

      {/* ─── Table ─── */}
      <Table<Product>
        rowKey="id"
        loading={loading}
        dataSource={paginatedData}
        pagination={false}
        bordered={false}
        className="ikas-style-table"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        onRow={(record) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement;
            const cell = target.closest("td");
            if (!cell) return;
            const index = (cell as any).cellIndex;
            if (index === 3) {
              setActiveQuickEdit({ id: record.id, type: "pricing" });
            } else if (index === 4) {
              setActiveQuickEdit({ id: record.id, type: "inventory" });
            }
          }
        })}
        columns={[
          {
            title: (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                Ürün <span style={{ fontSize: 10, color: "#bbb" }}>⇅</span>
              </div>
            ),
            key: "product",
            render: (_, r) => {
              const productMedia = r.media?.[0];
              const activeVariants = (r.variants || []).filter((v) => v.is_active !== false && v.is_active !== 0);
              const variantsList = activeVariants.length ? activeVariants : (r.variants || []);
              const defaultVariant = variantsList.find((v) => v.is_default === true || v.is_default === 1);
              const variantForMedia = defaultVariant || variantsList[0];
              const variantMediaList = variantForMedia ? (variantForMedia.media || variantForMedia.medias || []) : [];
              variantMediaList.sort((a, b) => (Number(a.position ?? 0) - Number(b.position ?? 0)));
              const variantMedia = variantMediaList.length ? variantMediaList[0] : null;
              const mainMedia = productMedia || variantMedia;
              const thumbUrl = mainMedia ? resolvePublicUrl((mainMedia as any).thumb_path || (mainMedia as any).path) : null;
              const fullUrl = mainMedia ? resolvePublicUrl((mainMedia as any).path) : null;
              const variantCount = (r.variants || []).length;

              return (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Popover
                    content={
                      <div style={{ padding: 4 }}>
                        {fullUrl ? (
                          <img src={fullUrl} style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }} alt={r.name} />
                        ) : "Görsel yok"}
                      </div>
                    }
                    placement="right"
                    styles={{ body: { padding: 0 } }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 8,
                      background: "#f8fafc", border: "1px solid #e2e8f0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      overflow: "hidden", flexShrink: 0,
                    }}>
                      {thumbUrl ? (
                        <img src={thumbUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ color: "#cbd5e1", fontSize: 14 }}>+</div>
                      )}
                    </div>
                  </Popover>
                  <div style={{ overflow: "hidden", minWidth: 0 }}>
                    <Link
                      href={`/admin/product/edit/${r.id}`}
                      style={{
                        fontWeight: 600, color: "#1a1a2e", display: "block",
                        textDecoration: "none", fontSize: 14,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}
                    >
                      {r.name}
                    </Link>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {r.sku ? `P1 / ${r.sku}` : "—"}
                    </div>
                    {variantCount > 0 && (
                      <div style={{ fontSize: 12, color: "#5E5CE6", fontWeight: 500 }}>
                        {variantCount} varyant
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          },
          {
            title: "Satış Fiyatı",
            key: "selling_price",
            width: 130,
            className: "clickable-cell",
            render: (_, r) => {
              if (r.variants && r.variants.length > 0) {
                const activeV = r.variants.filter(v => v.is_active !== false && v.is_active !== 0);
                const list = activeV.length ? activeV : r.variants;
                const prices = list.map(v => Number((v as any).price)).filter(n => Number.isFinite(n));
                const sellingPrices = list.map(v => {
                  const sp = v.discount_price ?? v.selling_price;
                  return Number((sp !== null && sp !== undefined && sp !== "") ? sp : (v as any).price);
                }).filter(n => Number.isFinite(n));
                if (prices.length) {
                  const sellMin = Math.min(...(sellingPrices.length ? sellingPrices : prices));
                  const sellMax = Math.max(...(sellingPrices.length ? sellingPrices : prices));
                  const origMin = Math.min(...prices);
                  const origMax = Math.max(...prices);
                  const pSuffix = resolvePriceSuffix(r.unit);
                  const hasDiscount = sellMin < origMin || sellMax < origMax;
                  if (hasDiscount) {
                    return (
                      <div style={{ lineHeight: 1.4 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          <del>₺ {formatCurrencyValue(origMin)}{origMin !== origMax ? ` - ₺ ${formatCurrencyValue(origMax)}` : ""}</del>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", fontFamily: "'Outfit', sans-serif" }}>
                          ₺ {formatCurrencyValue(sellMin)}{sellMin !== sellMax ? ` - ₺ ${formatCurrencyValue(sellMax)}` : ""}{pSuffix}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#333", fontFamily: "'Outfit', sans-serif" }}>
                      ₺ {formatCurrencyValue(origMin)}{origMin !== origMax ? ` - ₺ ${formatCurrencyValue(origMax)}` : ""}{pSuffix}
                    </div>
                  );
                }
              }
              const price = Number(r.price ?? 0);
              const dp = Number(r.discount_price ?? 0);
              const hasDiscount = !!r.discount_price && dp < price;
              const pSuffix = resolvePriceSuffix(r.unit);
              if (hasDiscount) {
                return (
                  <div style={{ lineHeight: 1.4 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}><del>₺ {formatCurrencyValue(price)}</del></div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", fontFamily: "'Outfit', sans-serif" }}>₺ {formatCurrencyValue(dp)}{pSuffix}</div>
                  </div>
                );
              }
              return (
                <div style={{ fontSize: 14, fontWeight: 500, color: "#333", fontFamily: "'Outfit', sans-serif" }}>
                  ₺ {formatCurrencyValue(price)}{pSuffix}
                </div>
              );
            }
          },
          {
            title: (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                Envanter <span style={{ fontSize: 10, color: "#bbb" }}>⇅</span>
              </div>
            ),
            key: "inventory",
            width: 170,
            className: "clickable-cell",
            render: (_, r) => {
              const displayUnit = resolveStockSuffix(r.unit);
              const isDecimal = r.unit?.is_decimal_stock ?? false;
              if (r.variants && r.variants.length > 0) {
                const activeV = r.variants.filter(v => v.is_active !== false && v.is_active !== 0);
                const count = activeV.length || r.variants.length;
                const sumQty = (activeV.length ? activeV : r.variants).reduce((s, v) => s + (Number(v.qty) || 0), 0);
                return (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#333", fontFamily: "'Outfit', sans-serif" }}>
                      {formatStockNumber(sumQty, isDecimal)}{displayUnit}
                    </div>
                    <div style={{ fontSize: 12, color: "#5E5CE6", fontWeight: 500 }}>{count} varyant</div>
                  </div>
                );
              }
              const qty = Number(r.qty ?? 0);
              const hasBackorder = Boolean(r.allow_backorder);
              const isAvailable = qty > 0 || hasBackorder;
              return (
                <div style={{
                  fontSize: 14, fontWeight: 500, fontFamily: "'Outfit', sans-serif",
                  color: isAvailable ? "#333" : "#ef4444",
                }}>
                  {qty > 0 ? `${formatStockNumber(qty, isDecimal)}${displayUnit}` : (hasBackorder ? "Ön sipariş" : "Stok yok")}
                </div>
              );
            }
          },
          {
            title: "Kategori",
            key: "category",
            width: 140,
            render: (_, r) => {
              const primary = r.categories?.find(c => Boolean(c.pivot?.is_primary));
              const first = primary || r.categories?.[0];
              return first ? (
                <div style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{first.name}</div>
              ) : (
                <div style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>Kategorisiz</div>
              );
            }
          },
          {
            title: "Marka",
            key: "brand",
            width: 120,
            render: (_, r) => r.brand ? (
              <AntTag style={{ background: "#f1f5f9", border: "none", color: "#64748b", margin: 0, fontSize: 11, fontWeight: 600 }}>
                {r.brand.name}
              </AntTag>
            ) : (
              <div style={{ fontSize: 11, color: "#ccc" }}>—</div>
            )
          },
          {
            title: "Durum",
            key: "status",
            width: 100,
            render: (_, r) => (
              <AntTag
                color={r.is_active ? "success" : "default"}
                style={{ borderRadius: 12, paddingLeft: 10, paddingRight: 10, fontWeight: 500 }}
              >
                {r.is_active ? "Yayında" : "Pasif"}
              </AntTag>
            )
          },
          {
            title: "Oluşturulma Tarihi",
            dataIndex: "created_at",
            key: "created_at",
            width: 150,
            render: (v) => (
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>
                <div>{dayjs(v).format("D MMMM YYYY")}</div>
                <div style={{ fontSize: 12, color: "#999" }}>{dayjs(v).format("HH:mm")}</div>
              </div>
            )
          },
          {
            title: "Güncellenme Tarihi",
            dataIndex: "updated_at",
            key: "updated_at",
            width: 150,
            render: (v) => v ? (
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>
                <div>{dayjs(v).format("D MMMM YYYY")}</div>
                <div style={{ fontSize: 12, color: "#999" }}>{dayjs(v).format("HH:mm")}</div>
              </div>
            ) : <span style={{ color: "#ccc" }}>—</span>
          },
          {
            title: "İşlemler",
            key: "actions",
            align: "right" as const,
            width: 130,
            render: (_, r) => (
              <Space size={8} onClick={(e) => e.stopPropagation()}>
                {hasPermission(me, "products.index") && (
                  <Link
                    href={r?.slug ? `/urun/${r.slug}` : `/urun/${r.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      type="text"
                      icon={<EyeOutlined style={{ color: "#64748b" }} />}
                      style={{ borderRadius: 6 }}
                    />
                  </Link>
                )}
                {hasPermission(me, "products.edit") && (
                  <Link href={`/admin/product/edit/${r.id}`}>
                    <Button
                      type="text"
                      icon={<EditOutlined style={{ color: "#5E5CE6" }} />}
                      style={{ borderRadius: 6, background: "#f0f0ff" }}
                    />
                  </Link>
                )}
                {hasPermission(me, "products.destroy") && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(r.id)}
                    style={{ borderRadius: 6 }}
                  />
                )}
              </Space>
            )
          },
        ]}
      />

      {/* ─── Pagination Footer ─── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderTop: "1px solid #f0f0f0",
        borderRadius: "0 0 12px 12px",
        fontSize: 13,
        color: "#666",
        position: "sticky",
        bottom: 0,
        zIndex: 5,
      }}>
        {/* Left: rows per page + range */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ whiteSpace: "nowrap" }}>Satır Adedi:</span>
          <Select
            size="small"
            value={pageSize}
            onChange={(v) => { setPageSize(v); setCurrentPage(1); }}
            style={{ width: 65 }}
            options={[
              { value: 10, label: "10" },
              { value: 20, label: "20" },
              { value: 50, label: "50" },
              { value: 100, label: "100" },
            ]}
          />
          <span style={{ color: "#999" }}>
            {rangeStart} - {rangeEnd} / {totalFiltered} Ürün
          </span>
        </div>

        {/* Right: page numbers */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{
              ...pgBtnStyle,
              opacity: currentPage <= 1 ? 0.4 : 1,
              cursor: currentPage <= 1 ? "default" : "pointer",
            }}
          >
            <LeftOutlined style={{ fontSize: 11 }} /> Önceki
          </button>

          {buildPageNumbers(currentPage, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} style={{ padding: "0 4px", color: "#bbb" }}>...</span>
            ) : (
              <button
                key={p}
                onClick={() => setCurrentPage(p as number)}
                style={{
                  ...pgBtnStyle,
                  background: currentPage === p ? "#1a1a2e" : "transparent",
                  color: currentPage === p ? "#fff" : "#555",
                  fontWeight: currentPage === p ? 700 : 400,
                  minWidth: 32,
                  borderRadius: 6,
                }}
              >
                {p}
              </button>
            )
          )}

          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{
              ...pgBtnStyle,
              opacity: currentPage >= totalPages ? 0.4 : 1,
              cursor: currentPage >= totalPages ? "default" : "pointer",
            }}
          >
            Sonraki <RightOutlined style={{ fontSize: 11 }} />
          </button>
        </div>
      </div>

      <QuickEditDrawers
        productId={activeQuickEdit?.id || null}
        type={activeQuickEdit?.type || null}
        onClose={() => setActiveQuickEdit(null)}
        onSuccess={() => void reloadData()}
      />

      <BulkEditModal
        open={bulkEditOpen}
        selectedIds={selectedRowKeys as (string | number)[]}
        onClose={() => setBulkEditOpen(false)}
        onSuccess={() => {
          setSelectedRowKeys([]);
          void reloadData();
        }}
      />

      <style jsx global>{`
        .ikas-style-table {
            background: #ffffff;
            border-radius: 12px 12px 0 0;
            border: 1px solid #f0f0f0;
            border-bottom: none;
            overflow: hidden;
        }
        .ikas-style-table .ant-table-thead > tr > th {
          background: #fafafa !important;
          border-bottom: 1px solid #f0f0f0 !important;
          color: #888 !important;
          font-weight: 500 !important;
          font-size: 13px !important;
          padding: 12px 16px !important;
        }
        .ikas-style-table .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f5f5f5 !important;
        }
        .ikas-style-table .ant-table-tbody > tr:hover > td {
          background: #fafafa !important;
        }
        .ikas-style-table .ant-table-tbody tr td.clickable-cell {
          cursor: pointer;
        }
        .ikas-style-table .ant-table-tbody tr td.clickable-cell:hover {
          color: #5E5CE6;
        }
        .ikas-style-table .ant-table {
           background: transparent !important;
        }
        .ikas-style-table .ant-table-selection-column {
          padding-left: 16px !important;
        }
      `}</style>
    </>
  );
}

/* ─── Pagination helpers ─── */

const pgBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  color: "#555",
  padding: "5px 10px",
  display: "flex",
  alignItems: "center",
  gap: 4,
  borderRadius: 6,
  whiteSpace: "nowrap",
};

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  pages.push(1);
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
