"use client";

import { DeleteOutlined, SearchOutlined, SyncOutlined } from "@ant-design/icons";
import { App, Button, Card, Checkbox, DatePicker, Drawer, Form, Input, InputNumber, Radio, Select, Space, Table, Typography } from "antd";
import { useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import type { RadioChangeEvent, TableColumnsType } from "antd";
import { apiFetch } from "@/lib/api";

const { Text } = Typography;

type NamePath = string | number | Array<string | number>;

type FormApi = {
  getFieldValue: (name: NamePath) => unknown;
  setFieldValue: (name: NamePath, value: unknown) => void;
  setFieldsValue: (values: Record<string, unknown>) => void;
};

type VariantValue = {
  id?: string | number | null;
  valueId?: string | number | null;
  valueUid?: string | number | null;
  value_id?: string | number | null;
  uid?: string | number | null;
  label?: string | null;
  name?: string | null;
  value?: string | number | null;
  color?: string | null;
  image?: unknown;
  position?: number | null;
  variationId?: string | number | null;
  [key: string]: unknown;
};

type VariantLike = {
  id?: string | number | null;
  uids?: string | null;
  key?: string | null;
  _tableIndex?: number;
  name?: string | null;
  sku?: string | null;
  price?: number | string | null;
  discount_price?: number | string | null;
  discount_start?: string | null;
  discount_end?: string | null;
  qty?: number | string | null;
  allow_backorder?: boolean | number | null;
  in_stock?: boolean | number | null;
  is_active?: boolean | number | null;
  is_default?: boolean | number | null;
  media?: MediaItem[];
  medias?: MediaItem[];
  values?: VariantValue[];
  [key: string]: unknown;
};

type MediaItem = {
  thumb_path?: string | null;
  path?: string | null;
  [key: string]: unknown;
};

type VariationLike = {
  id?: string | number | null;
  name?: string | null;
  values?: VariantValue[];
  [key: string]: unknown;
};

type VariantRow = VariantLike & {
  __index: number;
  __rowId: string;
};

type StockDrawerState = {
  rowId: string;
  variantIndex: number;
  variantName: string;
  qty: number;
  allowBackorder: boolean;
} | null;

function resolvePublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${base}/storage/${normalized}`;
}

function rowIdOf(v: VariantLike, fallbackIndex: number): string {
  const id = v?.id ?? v?.uids ?? v?.key ?? v?._tableIndex ?? fallbackIndex;
  return String(id ?? fallbackIndex);
}

function parseMaybeDayjs(val: unknown): Dayjs | null {
  if (!val) return null;
  if (dayjs.isDayjs(val)) return val;
  const d = dayjs(val);
  return d.isValid() ? d : null;
}

function formatForBackend(d: unknown): string | null {
  if (!d) return null;
  const dd = dayjs(d);
  if (!dd.isValid()) return null;
  return dd.format("YYYY-MM-DD HH:mm:ss");
}

function computeUidsFromValues(vals: unknown): string {
  if (!Array.isArray(vals)) return "";
  const uids = vals
    .map((x) => {
      const value = x as VariantValue;
      return value?.valueUid ?? value?.uid ?? value?.valueId ?? value?.value_id ?? value?.id ?? null;
    })
    .filter((x) => x !== null && x !== undefined)
    .map((x) => String(x))
    .sort();
  return uids.join(".");
}

type BulkScope = "" | "selected" | "all" | "value";
type BulkField = "price" | "discount_price" | "discount_dates" | "qty" | "sku" | "is_active";

export function VariantSection({
  form,
  unit,
  selectedRowKeys,
  onSelectedRowKeysChange,
  onOpenMedia,
  setSelectedVariations,
}: {
  form: FormApi;
  unit?: Record<string, unknown>;
  selectedRowKeys: string[];
  onSelectedRowKeysChange: (keys: string[]) => void;
  onOpenMedia: (variant: VariantLike, uids: string) => void;
  setSelectedVariations: (variations: VariationLike[]) => void;
}) {
  return (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldValue }) => {
        const variants = (getFieldValue(["variants"]) ?? []) as VariantLike[];
        const variations = (getFieldValue(["variations"]) ?? []) as VariationLike[];
        const deletedVariantUids = (getFieldValue(["deleted_variant_uids"]) ?? []) as Array<string | number>;
        return (
          <VariantSectionInner
            form={form}
            unit={unit}
            selectedRowKeys={selectedRowKeys}
            onSelectedRowKeysChange={onSelectedRowKeysChange}
            onOpenMedia={onOpenMedia}
            variants={variants}
            variations={variations}
            deletedVariantUids={deletedVariantUids}
            setSelectedVariations={setSelectedVariations}
          />
        );
      }}
    </Form.Item>
  );
}

function VariantSectionInner({
  form,
  unit,
  selectedRowKeys,
  onSelectedRowKeysChange,
  onOpenMedia,
  variants,
  variations,
  deletedVariantUids,
  setSelectedVariations,
}: {
  form: FormApi;
  unit?: Record<string, unknown>;
  selectedRowKeys: string[];
  onSelectedRowKeysChange: (keys: string[]) => void;
  onOpenMedia: (variant: VariantLike, uids: string) => void;
  variants: VariantLike[];
  variations: VariationLike[];
  deletedVariantUids: Array<string | number>;
  setSelectedVariations: (variations: VariationLike[]) => void;
}) {
  const { message } = App.useApp();

  const normalizeNumber = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkScope, setBulkScope] = useState<BulkScope>("");
  const [bulkValueId, setBulkValueId] = useState<string>("");
  const [bulkField, setBulkField] = useState<BulkField>("price");
  const [bulkBool, setBulkBool] = useState<boolean>(true);
  const [bulkText, setBulkText] = useState<string>("");
  const [bulkNumber, setBulkNumber] = useState<number | null>(null);
  const [bulkDates, setBulkDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockDrawer, setStockDrawer] = useState<StockDrawerState>(null);
  const [generatingVariantSkuRowId, setGeneratingVariantSkuRowId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const arr = (variants ?? []) as VariantLike[];
    return arr.map((v, index) => ({
      __index: index,
      __rowId: rowIdOf(v, index),
      ...v,
    }));
  }, [variants]);

  const stockSuffix = unit?.stock_prefix || unit?.suffix || unit?.short_name || unit?.label || unit?.name;
  const rawDecimalFlag = unit?.is_decimal_stock;
  const isDecimalStock = rawDecimalFlag === true
    || rawDecimalFlag === 1
    || String(rawDecimalFlag).toLowerCase() === "1"
    || String(rawDecimalFlag).toLowerCase() === "true";
  const stockStep = isDecimalStock ? 0.01 : 1;
  const stockPrecision = isDecimalStock ? 2 : 0;

  const valueOptions = useMemo(() => {
    const opts: Array<{ label: string; value: string }> = [];
    for (const variation of variations ?? []) {
      for (const val of variation?.values ?? []) {
        const id = val?.id;
        const label = (val?.label ?? val?.name ?? val?.value ?? "").toString().trim();
        if (!id || !label) continue;
        opts.push({ label: `${variation?.name ?? "Seçenek"}: ${label}`, value: String(id) });
      }
    }
    return opts;
  }, [variations]);

  const defaultRowId = useMemo(() => {
    const idx = rows.findIndex((r) => r?.is_default === true || r?.is_default === 1);
    if (idx >= 0) return String(rows[idx].__rowId);
    return rows.length > 0 ? String(rows[0].__rowId) : "";
  }, [rows]);

  const sortedRows = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const aDef = String(a?.__rowId) === String(defaultRowId) ? 1 : 0;
      const bDef = String(b?.__rowId) === String(defaultRowId) ? 1 : 0;
      if (aDef !== bDef) return bDef - aDef;
      const aName = String(a?.name ?? "").toLowerCase();
      const bName = String(b?.name ?? "").toLowerCase();
      return aName.localeCompare(bName);
    });
    return arr;
  }, [rows, defaultRowId]);

  const visibleRows = useMemo(() => {
    const set = new Set(
      (Array.isArray(deletedVariantUids) ? deletedVariantUids : [])
        .map((x) => String(x))
        .filter((x: string) => x.trim() !== ""),
    );

    return sortedRows.filter((r) => {
      const active = r?.is_active !== false && r?.is_active !== 0;
      const u = String(r?.uids ?? "").trim();
      const isDeletedByUids = u ? set.has(u) : false;
      return active && !isDeletedByUids;
    });
  }, [sortedRows, deletedVariantUids]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return visibleRows;

    return visibleRows.filter((row) => {
      const name = String(row?.name ?? "").toLowerCase();
      const sku = String(row?.sku ?? "").toLowerCase();
      const uids = String(row?.uids ?? "").toLowerCase();
      return name.includes(q) || sku.includes(q) || uids.includes(q);
    });
  }, [visibleRows, searchTerm]);

  const showFieldStep = Boolean(bulkScope) && (bulkScope !== "value" || Boolean(bulkValueId));
  const showValueStep = showFieldStep;

  function setDefaultVariant(nextRowId: string) {
    const arr = (form.getFieldValue("variants") ?? []) as VariantLike[];
    if (!Array.isArray(arr) || arr.length === 0) return;
    const next = arr.map((v, idx) => ({ ...v, is_default: rowIdOf(v, idx) === String(nextRowId) }));
    form.setFieldsValue({ variants: next });
  }

  function targetIndexes(): number[] {
    const arr = (form.getFieldValue("variants") ?? []) as VariantLike[];
    if (!Array.isArray(arr) || arr.length === 0) return [];
    if (bulkScope === "all") return arr.map((_, i) => i);

    if (bulkScope === "selected") {
      const set = new Set(selectedRowKeys.map(String));
      return arr
        .map((v, i) => ({ i, id: rowIdOf(v, i) }))
        .filter((x) => set.has(x.id))
        .map((x) => x.i);
    }

    if (bulkScope === "value" && bulkValueId) {
      return arr
        .map((v, i) => ({ i, uids: String(v?.uids ?? "") }))
        .filter((x) => x.uids.split(".").map((t) => t.trim()).includes(String(bulkValueId)))
        .map((x) => x.i);
    }

    return [];
  }

  function applyBulk() {
    const idxs = targetIndexes();
    if (idxs.length === 0) return;

    const arr = (form.getFieldValue("variants") ?? []) as VariantLike[];
    const next = [...arr];

    for (const i of idxs) {
      const cur = next[i] ?? {};
      if (bulkField === "is_active") next[i] = { ...cur, is_active: bulkBool };
      if (bulkField === "sku") next[i] = { ...cur, sku: bulkText };
      if (bulkField === "price") next[i] = { ...cur, price: bulkNumber };
      if (bulkField === "discount_price") next[i] = { ...cur, discount_price: bulkNumber };
      if (bulkField === "qty") {
        const qty = bulkNumber ?? 0;
        next[i] = {
          ...cur,
          qty,
          in_stock: Boolean(cur?.allow_backorder) || qty > 0,
        };
      }
      if (bulkField === "discount_dates") {
        next[i] = {
          ...cur,
          discount_start: formatForBackend(bulkDates?.[0]),
          discount_end: formatForBackend(bulkDates?.[1]),
        };
      }
    }

    form.setFieldsValue({ variants: next });
  }

  const parsePositiveInt = (value: unknown): number | undefined => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
    return Math.trunc(numeric);
  };

  const generateVariantSku = async (record: VariantRow) => {
    const rowId = String(record?.__rowId ?? "");
    const vi = Number.isFinite(record?.__index) ? Number(record.__index) : -1;
    if (!rowId || vi < 0) return;

    const rowState = (form.getFieldValue(["variants", vi]) ?? variants?.[vi] ?? {}) as VariantLike;
    const valueSource = Array.isArray(rowState?.values)
      ? rowState.values
      : (Array.isArray(record?.values) ? record.values : []);

    const valueLabels = valueSource
      .map((val) => String(val?.label ?? val?.name ?? val?.value ?? "").trim())
      .filter((label: string) => label !== "");

    const productName = String(form.getFieldValue("name") ?? "").trim();
    const currentProductSku = String(form.getFieldValue("sku") ?? "").trim();
    const variantName = String(rowState?.name ?? record?.name ?? "").trim();
    const excludeProductId = parsePositiveInt(form.getFieldValue("id"));
    const excludeVariantId = parsePositiveInt(rowState?.id ?? record?.id);

    try {
      setGeneratingVariantSkuRowId(rowId);

      const response = await apiFetch<{ sku?: string; product_sku?: string }>("/api/products/generate-sku", {
        method: "POST",
        json: {
          type: "variant",
          product_name: productName || undefined,
          product_sku: currentProductSku || undefined,
          variant_name: variantName || undefined,
          values: valueLabels,
          exclude_product_id: excludeProductId,
          exclude_variant_id: excludeVariantId,
        },
      });

      const nextVariantSku = String(response?.sku ?? "").trim();
      if (!nextVariantSku) {
        throw new Error("Varyant SKU üretilemedi.");
      }

      const nextProductSku = String(response?.product_sku ?? "").trim();
      if (!currentProductSku && nextProductSku) {
        form.setFieldValue("sku", nextProductSku);
      }

      form.setFieldValue(["variants", vi, "sku"], nextVariantSku);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Varyant SKU oluşturulamadı.";
      message.error(errorMessage);
    } finally {
      setGeneratingVariantSkuRowId(null);
    }
  };

  const removeVariantRow = (record: VariantRow) => {
    const arr = (form.getFieldValue("variants") ?? []) as VariantLike[];
    if (!Array.isArray(arr) || arr.length === 0) return;

    const targetUids = (
      (record?.uids ? String(record.uids) : "")
      || computeUidsFromValues(record?.values)
    ).trim();
    const targetRowId = String(record?.__rowId ?? "");

    if (targetUids) {
      const prevDeletedRaw = form.getFieldValue("deleted_variant_uids") ?? [];
      const prevDeleted = (Array.isArray(prevDeletedRaw) ? prevDeletedRaw : [])
        .map((x) => String(x))
        .filter((x: string) => x.trim() !== "");
      const nextDeleted = Array.from(new Set([...prevDeleted, String(targetUids)]));
      form.setFieldsValue({ deleted_variant_uids: nextDeleted });
    }

    const next = arr.map((v, idx) => {
      const id = rowIdOf(v, idx);
      const vUids = (v?.uids ? String(v.uids) : "").trim();
      const matchByUids = Boolean(targetUids) && Boolean(vUids) && vUids === targetUids;
      const matchByRowId = !targetUids && String(id) === targetRowId;
      if (!matchByUids && !matchByRowId) return v;
      const ensuredUids = v?.uids ?? (targetUids || undefined);
      return { ...v, uids: ensuredUids, is_active: false };
    });

    const active = next.filter((v) => v?.is_active !== false && v?.is_active !== 0);

    if (active.length === 0) {
      form.setFieldsValue({ variants: [], variations: [] });
      setSelectedVariations([]);
      onSelectedRowKeysChange([]);
      return;
    }

    const activeHasDefault = active.some((v) => v?.is_default === true || v?.is_default === 1);
    const fallbackDefaultId = rowIdOf(active[0], 0);
    const normalized = next.map((v, idx) => {
      const isActive = v?.is_active !== false && v?.is_active !== 0;
      if (!isActive) return { ...v, is_default: false };
      if (activeHasDefault) return v;
      return { ...v, is_default: String(rowIdOf(v, idx)) === String(fallbackDefaultId) };
    });

    form.setFieldsValue({ variants: normalized });
    onSelectedRowKeysChange(selectedRowKeys.filter((k) => String(k) !== String(record?.__rowId)));
  };

  const openStockDrawer = (record: VariantRow) => {
    const vi = Number.isFinite(record.__index) ? Number(record.__index) : 0;
    const qty = normalizeNumber(variants?.[vi]?.qty ?? form.getFieldValue(["variants", vi, "qty"])) ?? 0;
    const allowBackorder = Boolean(
      variants?.[vi]?.allow_backorder ?? form.getFieldValue(["variants", vi, "allow_backorder"]) ?? false,
    );

    setStockDrawer({
      rowId: String(record.__rowId),
      variantIndex: vi,
      variantName: String(record?.name ?? record?.sku ?? record?.uids ?? "Varyant"),
      qty,
      allowBackorder,
    });
  };

  const saveStockDrawer = () => {
    if (!stockDrawer) return;

    const nextQty = Number(stockDrawer.qty ?? 0);
    const allowBackorder = Boolean(stockDrawer.allowBackorder);

    form.setFieldValue(["variants", stockDrawer.variantIndex, "qty"], nextQty);
    form.setFieldValue(["variants", stockDrawer.variantIndex, "allow_backorder"], allowBackorder);
    form.setFieldValue(["variants", stockDrawer.variantIndex, "in_stock"], allowBackorder || nextQty > 0);
    setStockDrawer(null);
  };

  const columns: TableColumnsType<VariantRow> = [
    {
      title: "Varyantlar",
      key: "variant",
      width: 280,
      render: (_value, record) => {
        const mediaArr = (record?.media ?? record?.medias ?? []) as MediaItem[];
        const first = Array.isArray(mediaArr) && mediaArr.length > 0 ? mediaArr[0] : null;
        const url = first?.thumb_path ? resolvePublicUrl(first.thumb_path) : first?.path ? resolvePublicUrl(first.path) : null;

        const name = (record?.name ?? "").toString().trim() || record?.uids || "-";
        const isDefault = String(record?.__rowId) === String(defaultRowId);

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onOpenMedia(record, String(record?.uids ?? record.__rowId))}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                overflow: "hidden",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {url ? (
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
              ) : (
                <div style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1 }}>+</div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Text strong>{name}</Text>
              {isDefault ? (
                <Text style={{ fontSize: 12, color: "#6f55ff" }}>Varsayılan</Text>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      title: "Satış Fiyatı",
      key: "price",
      width: 150,
      render: (_value, record) => {
        const vi = Number.isFinite(record.__index) ? Number(record.__index) : 0;
        return (
          <InputNumber
            size="middle"
            min={0}
            controls={false}
            style={{ width: "100%" }}
            step={0.01}
            precision={2}
            value={(variants?.[vi]?.price ?? form.getFieldValue(["variants", vi, "price"])) ?? undefined}
            onChange={(val) => {
              const next = val === null || val === undefined ? null : Number(val);
              form.setFieldValue(["variants", vi, "price"], next);
            }}
          />
        );
      },
    },
    {
      title: "İndirimli Fiyat",
      key: "discount_price",
      width: 150,
      render: (_value, record) => {
        const vi = Number.isFinite(record.__index) ? Number(record.__index) : 0;
        const price = Number(form.getFieldValue(["variants", vi, "price"]) ?? 0);
        const discountValue = variants?.[vi]?.discount_price ?? form.getFieldValue(["variants", vi, "discount_price"]);

        return (
          <InputNumber
            size="middle"
            min={0}
            max={price > 0 ? price : undefined}
            controls={false}
            style={{ width: "100%" }}
            step={0.01}
            precision={2}
            value={discountValue ?? undefined}
            onChange={(val) => {
              const next = val === null || val === undefined ? null : Number(val);
              const clamped = price > 0 && next !== null && next > price ? price : next;
              form.setFieldValue(["variants", vi, "discount_price"], clamped);
              if (!clamped || clamped <= 0) {
                form.setFieldValue(["variants", vi, "discount_start"], null);
                form.setFieldValue(["variants", vi, "discount_end"], null);
              }
            }}
          />
        );
      },
    },
    {
      title: "İndirim Tarihi",
      key: "discount_dates",
      width: 210,
      render: (_value, record) => {
        const vi = Number.isFinite(record.__index) ? Number(record.__index) : 0;
        const discountValue = Number(form.getFieldValue(["variants", vi, "discount_price"]) ?? 0);
        const start = parseMaybeDayjs(form.getFieldValue(["variants", vi, "discount_start"]));
        const end = parseMaybeDayjs(form.getFieldValue(["variants", vi, "discount_end"]));
        const dateValue: [Dayjs | null, Dayjs | null] | null = start && end ? [start, end] : null;

        return (
          <DatePicker.RangePicker
            size="middle"
            style={{ width: "100%" }}
            allowEmpty={[true, true]}
            disabled={discountValue <= 0}
            value={dateValue ?? undefined}
            onChange={(dates) => {
              form.setFieldValue(["variants", vi, "discount_start"], formatForBackend(dates?.[0]));
              form.setFieldValue(["variants", vi, "discount_end"], formatForBackend(dates?.[1]));
            }}
          />
        );
      },
    },
    {
      title: "SKU",
      key: "sku",
      width: 220,
      render: (_value, record) => {
        const vi = Number.isFinite(record.__index) ? Number(record.__index) : 0;
        const rowId = String(record?.__rowId ?? "");
        return (
          <Space.Compact style={{ width: "100%" }}>
            <Input
              size="middle"
              value={(variants?.[vi]?.sku ?? form.getFieldValue(["variants", vi, "sku"])) ?? ""}
              onChange={(e) => form.setFieldValue(["variants", vi, "sku"], e.target.value)}
            />
            <Button
              size="middle"
              icon={<SyncOutlined />}
              loading={generatingVariantSkuRowId === rowId}
              onClick={() => void generateVariantSku(record)}
              title="Varyant SKU otomatik oluştur"
            />
          </Space.Compact>
        );
      },
    },
    {
      title: "Stok",
      key: "stock",
      width: 160,
      align: "center" as const,
      render: (_value, record) => {
        const vi = Number.isFinite(record.__index) ? Number(record.__index) : 0;
        const qty = normalizeNumber(variants?.[vi]?.qty ?? form.getFieldValue(["variants", vi, "qty"])) ?? 0;
        const allowBackorder = Boolean(
          variants?.[vi]?.allow_backorder ?? form.getFieldValue(["variants", vi, "allow_backorder"]) ?? false,
        );
        const available = qty > 0 || allowBackorder;

        return (
          <button
            className="variant-stock-trigger"
            type="button"
            onClick={() => openStockDrawer(record)}
            style={{
              all: "unset",
              width: "100%",
              display: "block",
              cursor: "pointer",
              textAlign: "center",
              padding: "2px 0",
            }}
            aria-label="Stok düzenle"
          >
            <Text className="variant-stock-text" strong style={{ color: available ? "#16a34a" : "#ef4444" }}>
              {qty}{stockSuffix ? ` ${stockSuffix}` : ""}
            </Text>
          </button>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 88,
      align: "center" as const,
      render: (_value, record) => (
        <Space size={0}>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeVariantRow(record)} />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        style={{ marginTop: 24, borderRadius: 12 }}
        styles={{ body: { padding: 16 } }}
      >
        <div style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 12,
          background: "#fff",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          <Space size={10} wrap>
            {rows.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>Varsayılan:</Text>
                  <Select
                    size="middle"
                    value={defaultRowId || undefined}
                    onChange={(v) => setDefaultVariant(String(v))}
                    style={{ minWidth: 260, marginLeft: 8 }}
                    options={sortedRows.map((r) => ({
                      label: r?.name || r?.sku || r?.uids || r?.__rowId,
                      value: r?.__rowId,
                    }))}
                  />
                </div>
              </div>
            ) : null}
          </Space>

          <Space wrap align="center">
            <Button type="primary" onClick={() => setBulkOpen((open) => !open)} disabled={rows.length === 0} style={{ background: "#6f55ff" }}>
              Toplu Güncelle
            </Button>
          </Space>
        </div>

        {bulkOpen ? (
          <div style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "14px 16px",
            background: "#f8fafc",
            marginBottom: 14,
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: "0 0 260px", maxWidth: 320 }}>
                <Text style={{ fontSize: 12, color: "#64748b" }}>1. Hedef</Text>
                <Select
                  value={bulkScope || undefined}
                  onChange={(v) => {
                    setBulkScope(v);
                    setBulkValueId("");
                    setBulkField("price");
                    setBulkBool(true);
                    setBulkText("");
                    setBulkNumber(null);
                    setBulkDates(null);
                  }}
                  placeholder="Seçiniz"
                  style={{ width: "100%", marginTop: 6 }}
                  options={[
                    { label: "Seçili varyantlar", value: "selected" },
                    { label: "Tüm varyantlar", value: "all" },
                    { label: "Varyasyon değerine göre", value: "value" },
                  ]}
                />
              </div>

              {bulkScope === "value" ? (
                <div style={{ flex: "0 0 260px", maxWidth: 320 }}>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>1.1 Değer</Text>
                  <Select
                    value={bulkValueId || undefined}
                    onChange={(v) => setBulkValueId(String(v))}
                    style={{ width: "100%", marginTop: 6 }}
                    options={valueOptions}
                    showSearch
                    optionFilterProp="label"
                    placeholder="Seçiniz"
                  />
                </div>
              ) : null}

              {showFieldStep ? (
                <div style={{ flex: "0 0 260px", maxWidth: 320 }}>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>2. Alan</Text>
                  <Select
                    value={bulkField}
                    onChange={(v) => setBulkField(v)}
                    style={{ width: "100%", marginTop: 6 }}
                    options={[
                      { label: "Fiyat", value: "price" },
                      { label: "İndirimli Fiyat", value: "discount_price" },
                      { label: "İndirim Tarihi", value: "discount_dates" },
                      { label: "Stok Adedi", value: "qty" },
                      { label: "SKU", value: "sku" },
                      { label: "Aktif / Pasif", value: "is_active" },
                    ]}
                  />
                </div>
              ) : null}

              {showValueStep ? (
                <div style={{ flex: "0 0 260px", maxWidth: 360 }}>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>3. Değer</Text>
                  <div style={{ marginTop: 6 }}>
                    {bulkField === "is_active" ? (
                      <Radio.Group value={bulkBool ? 1 : 0} onChange={(e: RadioChangeEvent) => setBulkBool(e.target.value === 1)}>
                        <Radio value={1}>Aktif</Radio>
                        <Radio value={0}>Pasif</Radio>
                      </Radio.Group>
                    ) : null}

                    {bulkField === "sku" ? (
                      <Input value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="SKU" />
                    ) : null}

                    {(bulkField === "price" || bulkField === "discount_price") ? (
                      <InputNumber
                        value={bulkNumber ?? undefined}
                        onChange={(v) => setBulkNumber(v === null || v === undefined ? null : Number(v))}
                        style={{ width: "100%" }}
                        min={0}
                        controls={false}
                        step={0.01}
                        precision={2}
                      />
                    ) : null}

                    {bulkField === "qty" ? (
                      <InputNumber
                        value={bulkNumber ?? undefined}
                        onChange={(v) => setBulkNumber(v === null || v === undefined ? null : Number(v))}
                        style={{ width: "100%" }}
                        min={0}
                        controls={false}
                        step={stockStep}
                        precision={stockPrecision}
                      />
                    ) : null}

                    {bulkField === "discount_dates" ? (
                      <DatePicker.RangePicker value={bulkDates} onChange={(v) => setBulkDates(v ?? null)} style={{ width: "100%" }} />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {showValueStep ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <Text type="secondary">Hedeflenen varyant: {targetIndexes().length}</Text>
                <Button type="primary" onClick={applyBulk} disabled={targetIndexes().length === 0} style={{ background: "#6f55ff", minWidth: 140 }}>
                  Uygula
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Varyantlarda ara"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 360, borderRadius: 0 }}
          />
        </div>

        <Table
          className="variant-table"
          rowKey={(record) => String(record?.__rowId ?? rowIdOf(record, 0))}
          dataSource={filteredRows}
          columns={columns}
          pagination={false}
          size="middle"
          tableLayout="fixed"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => onSelectedRowKeysChange(keys.map((k) => String(k))),
          }}
          scroll={{ x: 1180 }}
          style={{ border: "1px solid #edf2f7", borderRadius: 12, overflow: "hidden" }}
        />
      </Card>

      <style jsx>{`
        .variant-table :global(.ant-table-thead > tr > th),
        .variant-table :global(.ant-table-tbody > tr > td) {
          padding: 12px 14px !important;
        }

        .variant-table :global(.ant-table-thead > tr > th:nth-last-child(2)),
        .variant-table :global(.ant-table-tbody > tr > td:nth-last-child(2)) {
          padding-right: 20px !important;
        }

        .variant-stock-trigger .variant-stock-text {
          text-decoration: underline;
          text-decoration-color: transparent;
          text-underline-offset: 3px;
          transition: text-decoration-color 0.15s ease;
        }

        .variant-stock-trigger:hover .variant-stock-text {
          text-decoration-color: currentColor;
        }
      `}</style>

      <Drawer
        title={
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Text strong style={{ fontSize: 24 }}>Stoklar</Text>
            <Text type="secondary">{stockDrawer?.variantName}</Text>
          </div>
        }
        placement="right"
        width={480}
        onClose={() => setStockDrawer(null)}
        open={Boolean(stockDrawer)}
        footer={
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setStockDrawer(null)}>Kapat</Button>
            <Button type="primary" onClick={saveStockDrawer} style={{ background: "#6f55ff" }}>Kaydet</Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Checkbox
            checked={Boolean(stockDrawer?.allowBackorder)}
            onChange={(e) => setStockDrawer((prev) => {
              if (!prev) return prev;
              return { ...prev, allowBackorder: e.target.checked };
            })}
          >
            Stoğu tükenince satmaya devam et
          </Checkbox>

          <div>
            <Text style={{ display: "block", marginBottom: 8 }}>Ana Depo</Text>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={stockStep}
              precision={stockPrecision}
              controls={false}
              decimalSeparator="."
              value={stockDrawer?.qty ?? 0}
              onChange={(v) => setStockDrawer((prev) => {
                if (!prev) return prev;
                return { ...prev, qty: Number(v ?? 0) };
              })}
            />
          </div>
        </Space>
      </Drawer>
    </>
  );
}

