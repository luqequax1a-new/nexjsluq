"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Image,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
} from "antd";
import {
  CaretRightOutlined,
  EyeOutlined,
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/api";
import { useAuth, hasPermission } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { usePageHeader } from "@/hooks/usePageHeader";
import { getImageUrl } from "@/lib/media/getImageUrl";
import type { Order, OrderItem, OrderStatus, PaymentStatus, OrderOptions, PaginatedResponse } from "@/types/order";

const { RangePicker } = DatePicker;

const DEFAULT_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: t("admin.orders.status.pending", "Beklemede"),
  confirmed: t("admin.orders.status.confirmed", "Onaylandı"),
  processing: t("admin.orders.status.processing", "Hazırlanıyor"),
  shipped: t("admin.orders.status.shipped", "Kargoda"),
  delivered: t("admin.orders.status.delivered", "Teslim Edildi"),
  cancelled: t("admin.orders.status.cancelled", "İptal Edildi"),
  refunded: t("admin.orders.status.refunded", "İade Edildi"),
};

const DEFAULT_PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: t("admin.orders.payment_status.pending", "Bekliyor"),
  paid: t("admin.orders.payment_status.paid", "Ödendi"),
  failed: t("admin.orders.payment_status.failed", "Başarısız"),
  refunded: t("admin.orders.payment_status.refunded", "İade"),
  partial_refund: t("admin.orders.payment_status.partial_refund", "Kısmi İade"),
};

const formatCodeLabel = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatMoney = (amount: number | null | undefined, currencyCode: string | null | undefined) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currencyCode || "TRY",
  }).format(amount || 0);

const getAddressLines = (address?: Order["billing_address"]) => {
  if (!address) return [];
  const firstLine = [address.address_line_1, address.address_line_2].filter(Boolean).join(" ");
  const secondLine = [address.city, address.state, address.postal_code, address.country].filter(Boolean).join(" / ");
  return [firstLine, secondLine].filter(Boolean);
};

const getOptionSummary = (options: Record<string, string> | null | undefined) => {
  if (!options) return "";
  const entries = Object.entries(options).filter(([, value]) => String(value || "").trim());
  if (!entries.length) return "";
  return entries.map(([key, value]) => `${key}: ${value}`).join(" | ");
};

const formatQty = (val: unknown, unit?: { is_decimal_stock?: boolean | null } | null) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return "0";
  const useDecimals = Boolean(unit?.is_decimal_stock);
  const s = n.toFixed(useDecimals ? 3 : 0);
  return s.replace(/\.?0+$/, "");
};

const getStockUnitLabel = (item: OrderItem) => {
  const unit = item.product?.unit as
    | {
      stock_prefix?: string | null;
      quantity_prefix?: string | null;
      suffix?: string | null;
    }
    | null
    | undefined;

  const stockPrefix = String(unit?.stock_prefix ?? "").trim();
  const quantityPrefix = String(unit?.quantity_prefix ?? "").trim();
  const suffix = String(unit?.suffix ?? "").trim();
  const fallback = String(item.unit_label ?? "").trim();
  return stockPrefix || quantityPrefix || suffix || fallback || "adet";
};

const getOrderItemImageUrl = (item: OrderItem) => {
  const variantBaseImage = item.variant?.base_image?.url || item.variant?.base_image?.path || null;
  const variantMedia = item.variant?.media?.find((m) => String(m?.url || m?.path || "").trim());
  const rawImage = variantBaseImage || variantMedia?.url || variantMedia?.path || item.image;
  return getImageUrl(rawImage || undefined);
};

const getCustomerName = (order: Order) =>
  order.customer?.full_name ||
  order.billing_address?.full_name ||
  order.shipping_address?.full_name ||
  t("admin.orders.guest", "Misafir");

const getCustomerEmail = (order: Order) =>
  order.customer?.email || order.billing_address?.email || order.shipping_address?.email || "";

const statusClassByValue = (status: OrderStatus) => `status-${status}`;

export default function OrdersPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const { me } = useAuth();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [options, setOptions] = useState<OrderOptions | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "">("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const statusLabels = options?.statuses || DEFAULT_STATUS_LABELS;
  const paymentLabels = options?.payment_statuses || DEFAULT_PAYMENT_LABELS;

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const opts = await apiFetch<OrderOptions>("/api/orders/options");
        setOptions(opts);
      } catch (e) {
        console.error("Failed to load order options", e);
      }
    };

    void loadOptions();
  }, []);

  const loadOrders = useCallback(
    async (page = 1, pageSize = pagination.pageSize) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("per_page", String(pageSize));
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);
        if (paymentFilter) params.set("payment_status", paymentFilter);
        if (dateRange) {
          params.set("date_from", dateRange[0].format("YYYY-MM-DD"));
          params.set("date_to", dateRange[1].format("YYYY-MM-DD"));
        }

        const res = await apiFetch<PaginatedResponse<Order>>(`/api/orders?${params.toString()}`);
        setOrders(res.data || []);
        setExpandedRowKeys([]);
        setPagination((prev) => ({
          ...prev,
          current: res.current_page,
          pageSize: res.per_page || pageSize,
          total: res.total,
        }));
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : t("admin.orders.list.load_failed", "Siparişler yüklenemedi");
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [dateRange, message, pagination.pageSize, paymentFilter, search, statusFilter]
  );

  const toggleRowExpanded = useCallback((orderId: number) => {
    setExpandedRowKeys((prev) => {
      const hasKey = prev.includes(orderId);
      if (hasKey) return prev.filter((key) => key !== orderId);
      return [...prev, orderId];
    });
  }, []);

  useEffect(() => {
    void loadOrders(1, pagination.pageSize);
  }, [loadOrders, pagination.pageSize]);

  const handleStatusChange = useCallback(
    async (orderId: number, nextStatus: OrderStatus, currentStatus: OrderStatus) => {
      if (nextStatus === currentStatus) return;
      if (!hasPermission(me, "orders.edit")) {
        message.warning(t("admin.orders.permissions.cannot_edit", "Sipariş güncelleme yetkiniz yok."));
        return;
      }

      setStatusUpdatingId(orderId);
      try {
        await apiFetch(`/api/orders/${orderId}`, {
          method: "PUT",
          json: { status: nextStatus },
        });
        setOrders((prev) =>
          prev.map((item) => (item.id === orderId ? { ...item, status: nextStatus } : item))
        );
        message.success(t("admin.orders.status_updated", "Sipariş durumu güncellendi."));
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : t("admin.orders.status_update_failed", "Durum güncellenemedi.");
        message.error(errorMessage);
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [me, message]
  );

  const orderCountByEmail = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orders) {
      const email = getCustomerEmail(order).toLowerCase();
      if (!email) continue;
      map.set(email, (map.get(email) || 0) + 1);
    }
    return map;
  }, [orders]);

  const columns = useMemo<ColumnsType<Order>>(
    () => [
      {
        title: t("admin.orders.columns.order", "Sipariş"),
        key: "order_no",
        width: 190,
        render: (_value, record) => {
          const isExpanded = expandedRowKeys.includes(record.id);
          return (
            <div className="admin-order-no">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRowExpanded(record.id);
                }}
                className={`admin-order-expand-btn ${isExpanded ? "is-expanded" : ""}`}
                aria-label={isExpanded ? "Sipariş özetini kapat" : "Sipariş özetini aç"}
              >
                <CaretRightOutlined style={{ fontSize: 12, color: "#64748b" }} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/admin/orders/${record.id}`);
                }}
                className="admin-order-no-link"
              >
                <span className="admin-order-no-text">{record.order_number}</span>
              </button>
            </div>
          );
        },
      },
      {
        title: t("admin.orders.columns.customer", "Müşteri"),
        key: "customer_name",
        width: 210,
        render: (_value, record) => {
          const name = getCustomerName(record);
          const avatarText = name?.trim()?.[0] || "?";
          return (
            <div className="admin-customer-cell">
              <Avatar size="small" className="admin-customer-avatar">
                {avatarText}
              </Avatar>
              <span className="admin-customer-name">{name}</span>
            </div>
          );
        },
      },
      {
        title: t("admin.orders.columns.customer_email", "E-posta"),
        key: "customer_email",
        width: 220,
        render: (_value, record) => <span className="admin-muted-text">{getCustomerEmail(record) || "-"}</span>,
      },
      {
        title: t("admin.orders.payment_method", "Ödeme Yöntemi"),
        dataIndex: "payment_method",
        width: 170,
        render: (value: string | null) => <span className="admin-muted-text">{formatCodeLabel(value)}</span>,
      },
      {
        title: t("admin.orders.columns.status", "Durum"),
        dataIndex: "status",
        width: 170,
        render: (value: OrderStatus, record) => (
          <select
            value={value}
            disabled={statusUpdatingId === record.id || !hasPermission(me, "orders.edit")}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => void handleStatusChange(record.id, e.target.value as OrderStatus, value)}
            className={`admin-order-status-select ${statusClassByValue(value)}`}
          >
            {Object.entries(statusLabels).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        ),
      },
      {
        title: t("admin.orders.columns.total", "Toplam"),
        dataIndex: "grand_total",
        width: 130,
        align: "right",
        render: (value: number, record) => (
          <Typography.Text strong style={{ color: "#0f172a" }}>
            {formatMoney(value, record.currency_code)}
          </Typography.Text>
        ),
      },
      {
        title: "Kaçıncı Sipariş",
        key: "customer_order_number",
        width: 140,
        align: "center",
        render: (_value, record) => {
          const orderNumber = record.customer_order_number;
          if (!orderNumber || !record.customer_id) {
            return <span className="admin-muted-text">-</span>;
          }
          return (
            <span className="admin-order-count" style={{ fontWeight: 600, color: '#6366f1' }}>
              {orderNumber}. Sipariş
            </span>
          );
        },
      },
      {
        title: t("admin.common.created", "Oluşturulma"),
        dataIndex: "created_at",
        width: 130,
        render: (value: string) => (
          <div className="admin-created-cell">
            <div>{dayjs(value).format("DD.MM.YYYY")}</div>
            <div>{dayjs(value).format("HH:mm")}</div>
          </div>
        ),
      },
      {
        title: t("admin.common.actions", "İşlemler"),
        key: "actions",
        width: 90,
        align: "center",
        render: (_value, record) => (
          <Space size={4} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={t("admin.common.view", "Görüntüle")}>
              <Button
                type="text"
                icon={<EyeOutlined />}
                className="admin-order-action-btn"
                onClick={() => router.push(`/admin/orders/${record.id}/edit`)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [
      expandedRowKeys,
      handleStatusChange,
      me,
      orderCountByEmail,
      router,
      statusLabels,
      statusUpdatingId,
      toggleRowExpanded,
    ]
  );

  const expandedRowRender = useCallback((record: Order) => {
    const currencyCode = record.currency_code || "TRY";
    const items = record.items || [];
    const billingLines = getAddressLines(record.billing_address);
    const shippingLines = getAddressLines(record.shipping_address);
    const shippingValue = Number(record.shipping_total || 0);
    const discountValue = Number(record.discount_total || 0);
    const feeValue = Number(record.payment_fee || 0);
    const hasShipping = shippingValue > 0;
    const hasDiscount = discountValue > 0;
    const hasFee = feeValue > 0;
    const shownSubtotal =
      record.subtotal > 0 ? Number(record.subtotal || 0) : items.reduce((sum, item) => sum + (item.line_total || 0), 0);
    const paymentLabel = formatCodeLabel(record.payment_method);
    const shippingLabel = formatCodeLabel(record.shipping_method);

    return (
      <div className="admin-order-expanded">
        <div className="admin-order-expanded-grid">
          <section className="admin-order-expanded-card">
            <h4>Teslimat</h4>
            <p className="admin-order-expanded-name">{record.shipping_address?.full_name || "-"}</p>
            <p>{record.shipping_address?.phone || "-"}</p>
            {shippingLines.length ? shippingLines.map((line) => <p key={`shipping-${record.id}-${line}`}>{line}</p>) : <p>-</p>}
          </section>
          <section className="admin-order-expanded-card">
            <h4>Fatura</h4>
            <p className="admin-order-expanded-name">{record.billing_address?.full_name || "-"}</p>
            <p>{record.billing_address?.phone || "-"}</p>
            <p>{record.billing_address?.email || "-"}</p>
            {billingLines.length ? billingLines.map((line) => <p key={`billing-${record.id}-${line}`}>{line}</p>) : <p>-</p>}
          </section>
          <section className="admin-order-expanded-card admin-order-expanded-totals">
            <div className="admin-order-total-line">
              <span>Ara Toplam</span>
              <strong>{formatMoney(shownSubtotal, currencyCode)}</strong>
            </div>
            {hasShipping ? (
              <div className="admin-order-total-line">
                <span>Kargo ({shippingLabel})</span>
                <strong>{formatMoney(shippingValue, currencyCode)}</strong>
              </div>
            ) : null}
            {hasFee ? (
              <div className="admin-order-total-line">
                <span>Ödeme Ücreti ({paymentLabel})</span>
                <strong>{formatMoney(feeValue, currencyCode)}</strong>
              </div>
            ) : null}
            {hasDiscount ? (
              <div className="admin-order-total-line is-discount">
                <span>
                  İndirim{record.coupon_code ? ` (${record.coupon_code})` : ""}
                </span>
                <strong>-{formatMoney(discountValue, currencyCode)}</strong>
              </div>
            ) : null}
            <div className="admin-order-total-line is-grand">
              <span>Genel Toplam</span>
              <strong>{formatMoney(record.grand_total, currencyCode)}</strong>
            </div>
          </section>
        </div>
        <div className="admin-order-expanded-items">
          {items.length ? (
            items.map((item) => {
              const optionText = getOptionSummary(item.options);
              const variantName = String(item.variant?.name || "").trim();
              const qtyText = `${formatQty(item.quantity, item.product?.unit as { is_decimal_stock?: boolean | null } | null)} ${getStockUnitLabel(item)}`;
              return (
                <article key={item.id} className="admin-order-expanded-item">
                  <div className="admin-order-expanded-item-left">
                    <div className="admin-order-expanded-item-thumb">
                      <Image src={getOrderItemImageUrl(item)} alt={item.name} preview={false} />
                    </div>
                    <div className="admin-order-expanded-item-main">
                      <p className="admin-order-expanded-item-name">{item.name}</p>
                      {variantName ? <p className="admin-order-expanded-item-variant">{variantName}</p> : null}
                      {item.sku ? <p className="admin-order-expanded-item-sku">SKU: {item.sku}</p> : null}
                      {optionText ? <p className="admin-order-expanded-item-options">{optionText}</p> : null}
                    </div>
                  </div>
                  <strong className="admin-order-expanded-item-qty">{qtyText}</strong>
                </article>
              );
            })
          ) : (
            <div className="admin-order-expanded-empty">Bu siparişte ürün bulunamadı.</div>
          )}
        </div>
      </div>
    );
  }, []);

  const headerExtra = useMemo(
    () => (
      <Space size={12}>
        <Button icon={<ReloadOutlined />} onClick={() => void loadOrders(1, pagination.pageSize)} />
        {hasPermission(me, "orders.create") ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/admin/orders/new")}>
            {t("admin.orders.new_order", "Yeni Sipariş")}
          </Button>
        ) : null}
      </Space>
    ),
    [loadOrders, me, pagination.pageSize, router]
  );

  usePageHeader({
    title: t("admin.orders.title", "Siparişler"),
    extra: headerExtra,
  });

  return (
    <>
      <Card size="small" style={{ border: "1px solid #e5e7eb", marginBottom: 20 }}>
        <Row gutter={12} align="middle">
          <Col flex="1">
            <Input
              placeholder={t("admin.orders.search_placeholder", "Sipariş no veya müşteri ara...")}
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => void loadOrders(1, pagination.pageSize)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder={t("admin.orders.filter.status", "Durum")}
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter((v || "") as OrderStatus | "")}
              style={{ width: 150 }}
              allowClear
              options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
            />
          </Col>
          <Col>
            <Select
              placeholder={t("admin.orders.filter.payment_status", "Ödeme Durumu")}
              value={paymentFilter || undefined}
              onChange={(v) => setPaymentFilter((v || "") as PaymentStatus | "")}
              style={{ width: 170 }}
              allowClear
              options={Object.entries(paymentLabels).map(([value, label]) => ({ value, label }))}
            />
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col>
            <Button type="primary" icon={<FilterOutlined />} onClick={() => void loadOrders(1, pagination.pageSize)}>
              {t("admin.common.filter", "Filtrele")}
            </Button>
          </Col>
        </Row>
      </Card>

      <Card size="small" style={{ border: "1px solid #e5e7eb" }} styles={{ body: { padding: 0 } }}>
        <Table<Order>
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            showExpandColumn: false,
            expandRowByClick: false,
            onExpandedRowsChange: (keys) => setExpandedRowKeys([...keys]),
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: (nextKeys) => setSelectedRowKeys(nextKeys),
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) =>
              t("admin.orders.pagination.total", "Toplam :count sipariş").replace(":count", String(total)),
            onChange: (page, pageSize) => {
              const nextSize = pageSize || pagination.pageSize;
              setPagination((prev) => ({ ...prev, current: page, pageSize: nextSize }));
              void loadOrders(page, nextSize);
            },
          }}
          onRow={(record) => ({
            style: { cursor: "pointer" },
            onDoubleClick: () => router.push(`/admin/orders/${record.id}`),
          })}
        />
      </Card>

      <style jsx global>{`
        .admin-order-no {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .admin-order-expand-btn {
          border: none;
          background: transparent;
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          transition: transform 0.2s ease;
        }
        .admin-order-expand-btn.is-expanded {
          transform: rotate(90deg);
        }
        .admin-order-no-link {
          cursor: pointer;
          border: none;
          background: transparent;
          display: inline-flex;
          align-items: center;
          padding: 2px 0;
          color: #0f172a;
          font-weight: 600;
        }
        .admin-order-no-link:hover .admin-order-no-text {
          color: #2563eb;
        }
        .admin-order-no-text {
          transition: color 0.2s ease;
        }
        .admin-order-expanded {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 16px;
        }
        .admin-order-expanded-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }
        .admin-order-expanded-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          padding: 12px;
        }
        .admin-order-expanded-card h4 {
          margin: 0 0 8px;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }
        .admin-order-expanded-card p {
          margin: 0 0 4px;
          color: #334155;
          font-size: 12px;
          line-height: 1.5;
        }
        .admin-order-expanded-name {
          font-weight: 600;
          color: #0f172a;
        }
        .admin-order-total-line {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          padding: 4px 0;
          font-size: 12px;
          color: #334155;
        }
        .admin-order-total-line strong {
          color: #0f172a;
          font-size: 12px;
        }
        .admin-order-total-line.is-discount strong {
          color: #dc2626;
        }
        .admin-order-total-line.is-grand {
          margin-top: 6px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }
        .admin-order-total-line.is-grand strong {
          font-size: 13px;
          font-weight: 700;
        }
        .admin-order-expanded-items {
          border: 1px solid #e5e7eb;
          background: #ffffff;
        }
        .admin-order-expanded-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .admin-order-expanded-item:last-child {
          border-bottom: none;
        }
        .admin-order-expanded-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }
        .admin-order-expanded-item-thumb {
          width: 52px;
          height: 52px;
          border: 1px solid #e5e7eb;
          background: #f8fafc;
          overflow: hidden;
          flex-shrink: 0;
        }
        .admin-order-expanded-item-thumb .ant-image {
          width: 100%;
          height: 100%;
          display: block;
        }
        .admin-order-expanded-item-thumb .ant-image-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .admin-order-expanded-item-main {
          min-width: 0;
        }
        .admin-order-expanded-item-name {
          margin: 0;
          color: #0f172a;
          font-size: 13px;
          font-weight: 600;
        }
        .admin-order-expanded-item-variant {
          margin: 4px 0 0;
          color: #0f172a;
          font-size: 12px;
          font-weight: 500;
        }
        .admin-order-expanded-item-sku {
          margin: 4px 0 0;
          color: #475569;
          font-size: 12px;
        }
        .admin-order-expanded-item-options {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
        }
        .admin-order-expanded-item-qty {
          color: #0f172a;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }
        .admin-order-expanded-empty {
          padding: 12px;
          color: #64748b;
          font-size: 12px;
        }
        .ant-table-expanded-row > td {
          padding: 8px 12px !important;
          background: #f8fafc !important;
        }
        @media (max-width: 1200px) {
          .admin-order-expanded-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 900px) {
          .admin-order-expanded-grid {
            grid-template-columns: 1fr;
          }
          .admin-order-expanded-item {
            align-items: flex-start;
            gap: 8px;
          }
          .admin-order-expanded-item-qty {
            padding-left: 64px;
          }
        }
        .admin-customer-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .admin-customer-avatar.ant-avatar {
          background: #5e5ce6;
        }
        .admin-customer-name {
          font-weight: 500;
          color: #0f172a;
        }
        .admin-muted-text {
          color: #475569;
          font-size: 13px;
        }
        .admin-order-count {
          font-weight: 500;
          color: #475569;
        }
        .admin-created-cell {
          display: flex;
          flex-direction: column;
          line-height: 1.4;
          color: #475569;
          font-size: 12px;
        }
        .admin-order-action-btn.ant-btn {
          color: #0f172a;
        }
        .admin-order-action-btn.ant-btn:hover {
          color: #2563eb;
          background: #eff6ff;
        }
        .admin-order-status-select {
          height: 32px;
          min-width: 140px;
          border: 1px solid transparent;
          padding: 0 30px 0 10px;
          font-size: 13px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-repeat: no-repeat;
          background-position: calc(100% - 8px) center;
          background-size: 10px 10px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        }
        .admin-order-status-select.status-pending {
          background-color: #fffaf5;
          border-color: #fcd34d;
          color: #b45309;
        }
        .admin-order-status-select.status-confirmed {
          background-color: #eff6ff;
          border-color: #93c5fd;
          color: #1d4ed8;
        }
        .admin-order-status-select.status-processing {
          background-color: #eef2ff;
          border-color: #a5b4fc;
          color: #4338ca;
        }
        .admin-order-status-select.status-shipped {
          background-color: #ecfeff;
          border-color: #67e8f9;
          color: #0e7490;
        }
        .admin-order-status-select.status-delivered {
          background-color: #ecfdf5;
          border-color: #86efac;
          color: #166534;
        }
        .admin-order-status-select.status-cancelled {
          background-color: #fef2f2;
          border-color: #fca5a5;
          color: #b91c1c;
        }
        .admin-order-status-select.status-refunded {
          background-color: #f8fafc;
          border-color: #cbd5e1;
          color: #475569;
        }
      `}</style>
    </>
  );
}
