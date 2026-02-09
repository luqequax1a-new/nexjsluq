"use client";

import { DatePicker, Form, Input, InputNumber, Space, Table, Tooltip, Typography } from "antd";
import type { Key } from "react";
import { useMemo } from "react";
import dayjs, { type Dayjs } from "dayjs";

const { Text } = Typography;

type VariantLike = any;

function resolvePublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${base}/storage/${normalized}`;
}

function toNumberOrValue(val: any) {
  if (val === null || val === undefined || val === "") return val;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed !== "" && !Number.isNaN(Number(trimmed))) return Number(trimmed);
  }
  return val;
}

function rowIdOf(v: VariantLike, fallbackIndex?: number) {
  const id = v?.id ?? v?.uids ?? v?.key ?? v?._tableIndex ?? fallbackIndex;
  return String(id ?? "");
}

function normalizeVariant(v: VariantLike) {
  return {
    ...v,
    price: toNumberOrValue(v?.price),
    discount_price: toNumberOrValue(v?.discount_price),
    qty: toNumberOrValue(v?.qty),
  };
}

function VariantIndexResolver({
  rowId,
  children,
}: {
  rowId: string;
  children: (resolvedIndex: number | null, v: VariantLike | null) => any;
}) {
  return (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldValue }) => {
        const arr = (getFieldValue(["variants"]) ?? []) as VariantLike[];
        if (!Array.isArray(arr)) return children(null, null);

        const idx = arr.findIndex((x) => rowIdOf(x) === String(rowId));
        const v = idx >= 0 ? arr[idx] : null;
        return children(idx >= 0 ? idx : null, v);
      }}
    </Form.Item>
  );
}

function VariantThumbnail({
  record,
  rowId,
  onOpenMedia,
}: {
  record: VariantLike;
  rowId: string;
  onOpenMedia?: (variant: VariantLike, uids: string) => void;
}) {
  return (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldValue }) => {
        const arr = (getFieldValue(["variants"]) ?? []) as VariantLike[];
        const v = Array.isArray(arr) ? arr.find((x) => rowIdOf(x) === String(rowId)) : null;

        const mediaArr = (v?.media ?? v?.medias ?? []) as any[];
        const first = Array.isArray(mediaArr) && mediaArr.length > 0 ? mediaArr[0] : null;
        const url = first?.thumb_path
          ? resolvePublicUrl(first.thumb_path)
          : first?.path
            ? resolvePublicUrl(first.path)
            : null;

        return (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onOpenMedia?.(record, String(record?.uids ?? rowId))}
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            {url ? (
              <img
                src={url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                draggable={false}
              />
            ) : (
              <div style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1 }}>+</div>
            )}
          </div>
        );
      }}
    </Form.Item>
  );
}

function VariantNameCell({ rowId, fallbackRecord }: { rowId: string; fallbackRecord: VariantLike }) {
  return (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldValue }) => {
        const arr = (getFieldValue(["variants"]) ?? []) as VariantLike[];
        const v = Array.isArray(arr) ? arr.find((x) => rowIdOf(x) === String(rowId)) : null;
        const src = v ?? fallbackRecord;

        const rawName = src?.name ? String(src.name).trim() : "";
        let valuesArr = Array.isArray(src?.values) ? src.values : [];

        if ((!valuesArr || valuesArr.length === 0) && src?.uids) {
          const variations = getFieldValue(["variations"]) ?? [];
          const uids = String(src.uids)
            .split(".")
            .map((id) => id.trim())
            .filter(Boolean);

          if (Array.isArray(variations)) {
            valuesArr = [];
            variations.forEach((variation: any) => {
              (variation?.values ?? []).forEach((val: any) => {
                if (uids.includes(String(val?.id))) {
                  valuesArr.push({
                    id: val.id,
                    label: val.label ?? val.name ?? val.value,
                    color: val.color,
                    image: val.image,
                  });
                }
              });
            });
          }
        }

        const displayName =
          rawName ||
          (Array.isArray(valuesArr) && valuesArr.length > 0
            ? valuesArr.map((x: any) => x?.label ?? x?.name ?? x?.value).filter(Boolean).join(" / ")
            : "");

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
            {Array.isArray(valuesArr) && valuesArr.some((x: any) => x?.color) ? (
              <div style={{ display: "flex", gap: 6 }}>
                {valuesArr
                  .filter((x: any) => x?.color)
                  .slice(0, 3)
                  .map((val: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        backgroundColor: val.color,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                      title={val.label ?? val.name ?? val.value}
                    />
                  ))}
              </div>
            ) : null}
            <Text strong style={{ fontSize: 13 }}>
              {displayName}
            </Text>
          </div>
        );
      }}
    </Form.Item>
  );
}

function VariantQtyCell({ rowId, unit }: { rowId: string; unit?: any }) {
  const stockSuffix = unit?.stock_prefix || unit?.suffix || unit?.short_name || unit?.label || unit?.name;
  const isDecimalStock = unit?.is_decimal_stock === true || unit?.is_decimal_stock === 1;
  const step = isDecimalStock ? 0.01 : 1;
  const precision = isDecimalStock ? 2 : 0;

  return (
    <VariantIndexResolver rowId={rowId}>
      {(resolvedIndex, v) => {
        return resolvedIndex !== null ? (
          <Form.Item key={`${rowId}-qty-${resolvedIndex}`} name={["variants", resolvedIndex, "qty"]} noStyle>
            <Space.Compact style={{ width: "100%" }}>
              <InputNumber
                size="middle"
                min={0}
                controls={false}
                style={{ width: "100%" }}
                placeholder="0"
                step={step}
                precision={precision}
                decimalSeparator="."
              />
              <div
                style={{
                  padding: "0 8px",
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #d9d9d9",
                  borderLeft: 0,
                  background: "#fafafa",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                {stockSuffix}
              </div>
            </Space.Compact>
          </Form.Item>
        ) : (
          <Space.Compact style={{ width: "100%" }}>
            <InputNumber
              size="middle"
              min={0}
              controls={false}
              style={{ width: "100%" }}
              placeholder="0"
              disabled
              step={step}
              precision={precision}
              decimalSeparator="."
              value={v?.qty}
            />
            <div
              style={{
                padding: "0 8px",
                display: "flex",
                alignItems: "center",
                border: "1px solid #d9d9d9",
                borderLeft: 0,
                background: "#fafafa",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              {stockSuffix}
            </div>
          </Space.Compact>
        );
      }}
    </VariantIndexResolver>
  );
}

function VariantPriceCell({ rowId, unit }: { rowId: string; unit?: any }) {
  const step = unit?.price_step || 0.01;
  const precision = 2;

  return (
    <VariantIndexResolver rowId={rowId}>
      {(resolvedIndex) =>
        resolvedIndex !== null ? (
          <Form.Item
            key={`${rowId}-price-${resolvedIndex}`}
            name={["variants", resolvedIndex, "price"]}
            noStyle
            rules={[{ required: true, message: "Satış fiyatı zorunludur" }]}
          >
            <InputNumber
              size="middle"
              prefix="₺"
              min={0}
              controls={false}
              style={{ width: "100%" }}
              placeholder="0"
              step={step}
              precision={precision}
              decimalSeparator="."
            />
          </Form.Item>
        ) : (
          <InputNumber
            size="middle"
            prefix="₺"
            min={0}
            controls={false}
            style={{ width: "100%" }}
            placeholder="0"
            disabled
            step={step}
            precision={precision}
            decimalSeparator="."
          />
        )
      }
    </VariantIndexResolver>
  );
}

function VariantDiscountCell({ rowId, unit, form }: { rowId: string; unit?: any; form: any }) {
  const step = unit?.price_step || 0.01;
  const precision = 2;

  return (
    <VariantIndexResolver rowId={rowId}>
      {(resolvedIndex, v) => {
        const dp = v?.discount_price;
        const hasDiscount = typeof dp === "number" ? dp > 0 : Number(dp) > 0;

        return resolvedIndex !== null ? (
          <Form.Item key={`${rowId}-discount-${resolvedIndex}`} name={["variants", resolvedIndex, "discount_price"]} noStyle>
            <Tooltip title="0 veya boş bırakırsanız indirim uygulanmaz">
              <InputNumber
                size="middle"
                prefix="₺"
                min={0}
                controls={false}
                style={{ width: "100%" }}
                placeholder="—"
                step={step}
                precision={precision}
                decimalSeparator="."
                onChange={(val) => {
                  const nextVal = toNumberOrValue(val);
                  if (!nextVal || Number(nextVal) <= 0) {
                    form.setFieldValue(["variants", resolvedIndex, "discount_start"], null);
                    form.setFieldValue(["variants", resolvedIndex, "discount_end"], null);
                  }
                }}
              />
            </Tooltip>
          </Form.Item>
        ) : (
          <InputNumber
            size="middle"
            prefix="₺"
            min={0}
            controls={false}
            style={{ width: "100%" }}
            placeholder="—"
            disabled
            step={step}
            precision={precision}
            decimalSeparator="."
            value={hasDiscount ? dp : undefined}
          />
        );
      }}
    </VariantIndexResolver>
  );
}

function parseMaybeDayjs(val: any): Dayjs | null {
  if (!val) return null;
  if (dayjs.isDayjs(val)) return val;
  const d = dayjs(val);
  return d.isValid() ? d : null;
}

function VariantDiscountDatesCell({ rowId, form }: { rowId: string; form: any }) {
  return (
    <VariantIndexResolver rowId={rowId}>
      {(resolvedIndex, v) => {
        if (resolvedIndex === null) {
          return <Input size="middle" disabled placeholder="Başlangıç → Bitiş" />;
        }

        const dp = v?.discount_price;
        const hasDiscount = typeof dp === "number" ? dp > 0 : Number(dp) > 0;

        const start = parseMaybeDayjs(v?.discount_start);
        const end = parseMaybeDayjs(v?.discount_end);
        const value: [Dayjs, Dayjs] | null = start && end ? [start, end] : null;

        return (
          <DatePicker.RangePicker
            size="middle"
            style={{ width: "100%" }}
            placeholder={["Başlangıç", "Bitiş"]}
            disabled={!hasDiscount}
            allowEmpty={[true, true]}
            value={(hasDiscount ? (value as any) : undefined) as any}
            onChange={(dates) => {
              const next = dates as any;
              const s = next?.[0] ?? null;
              const e = next?.[1] ?? null;
              form.setFieldValue(["variants", resolvedIndex, "discount_start"], s ? dayjs(s).toISOString() : null);
              form.setFieldValue(["variants", resolvedIndex, "discount_end"], e ? dayjs(e).toISOString() : null);
            }}
          />
        );
      }}
    </VariantIndexResolver>
  );
}

function VariantSkuCell({ rowId }: { rowId: string }) {
  return (
    <VariantIndexResolver rowId={rowId}>
      {(resolvedIndex) =>
        resolvedIndex !== null ? (
          <Form.Item key={`${rowId}-sku-${resolvedIndex}`} name={["variants", resolvedIndex, "sku"]} noStyle>
            <Input size="middle" placeholder="SKU" />
          </Form.Item>
        ) : (
          <Input size="middle" placeholder="SKU" disabled />
        )
      }
    </VariantIndexResolver>
  );
}

export interface VariantTableProps {
  variants: VariantLike[];
  selectedRowKeys?: Array<Key>;
  onSelectedRowKeysChange?: (keys: Array<Key>) => void;
  onOpenMedia?: (variant: VariantLike, uids: string) => void;
  unit?: any;
}

export function VariantTable({ variants, selectedRowKeys, onSelectedRowKeysChange, onOpenMedia, unit }: VariantTableProps) {
  const form = Form.useFormInstance();

  const dataSource = useMemo(
    () =>
      (variants ?? []).map((v, idx) => ({
        ...v,
        _tableIndex: v?._tableIndex ?? idx,
        _rowId: rowIdOf(v, idx),
      })),
    [variants],
  );

  // NOTE: Do not reorder/sync form.variants here.
  // VariantManager is the source of truth for generating rows, and the edit page
  // loads variants from API. We only resolve the correct form index per rowId.

  const columns = [
    {
      title: "",
      key: "thumb",
      width: 48,
      render: (_: any, record: VariantLike, index: number) => (
        <VariantThumbnail record={record} rowId={String(record?._rowId ?? rowIdOf(record, index))} onOpenMedia={onOpenMedia} />
      ),
    },
    {
      title: "Varyant",
      dataIndex: "name",
      key: "name",
      width: 170,
      ellipsis: true,
      render: (_: any, record: VariantLike, index: number) => (
        <VariantNameCell rowId={String(record?._rowId ?? rowIdOf(record, index))} fallbackRecord={record} />
      ),
    },
    {
      title: "Stok",
      dataIndex: "qty",
      key: "qty",
      width: 140,
      render: (_: any, record: VariantLike, index: number) => (
        <VariantQtyCell rowId={String(record?._rowId ?? rowIdOf(record, index))} unit={unit} />
      ),
    },
    {
      title: "Satış Fiyatı",
      dataIndex: "price",
      key: "price",
      width: 150,
      render: (_: any, record: VariantLike, index: number) => (
        <VariantPriceCell rowId={String(record?._rowId ?? rowIdOf(record, index))} unit={unit} />
      ),
    },
    {
      title: "İndirimli",
      dataIndex: "discount_price",
      key: "discount_price",
      width: 150,
      render: (_: any, record: VariantLike, index: number) => (
        <VariantDiscountCell rowId={String(record?._rowId ?? rowIdOf(record, index))} unit={unit} form={form} />
      ),
    },
    {
      title: "İndirim Tarihi",
      key: "discount_dates",
      width: 240,
      render: (_: any, record: VariantLike, index: number) => (
        <VariantDiscountDatesCell rowId={String(record?._rowId ?? rowIdOf(record, index))} form={form} />
      ),
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 160,
      render: (_: any, record: VariantLike, index: number) => <VariantSkuCell rowId={String(record?._rowId ?? rowIdOf(record, index))} />,
    },
  ];

  return (
    <Table
      dataSource={dataSource}
      columns={columns as any}
      pagination={false}
      size="middle"
      rowKey={(record: any) => String(record?._rowId ?? rowIdOf(record))}
      rowSelection={
        onSelectedRowKeysChange
          ? {
              selectedRowKeys,
              onChange: (keys) => onSelectedRowKeysChange(keys.map((k) => String(k))),
            }
          : undefined
      }
      rowClassName={() => "variant-row"}
      scroll={{ x: "max-content" }}
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: 8,
        overflow: "hidden",
      }}
    />
  );
}
