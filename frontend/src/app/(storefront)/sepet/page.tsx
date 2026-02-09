"use client";

import { useCart } from "@/context/CartContext";
import { useEffect } from "react";
import Link from "next/link";
import { Button, Table } from "antd";
import { DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { formatPrice } from "@/lib/utils";
import { OrderSummaryCard } from "@/components/storefront/cart/OrderSummaryCard";
import { getImageUrl } from "@/lib/media/getImageUrl";
import { useStorefrontSettings } from "@/context/StorefrontSettingsContext";
import {
  DEFAULT_WHATSAPP_CART_TEMPLATE,
  buildWhatsAppUrl,
  fillTemplate,
} from "@/lib/whatsapp";
import type { ColumnsType } from "antd/es/table";

export default function CartPage() {
  const { cart, removeFromCart, clearCart, updateItemQuantity, isLoading, isHydrated, checkOffers } = useCart();
  const { settings } = useStorefrontSettings();

  // Check for cart offers on mount
  useEffect(() => {
    if (isHydrated && !isLoading && cart?.items?.length) {
      checkOffers('cart');
    }
  }, [isHydrated, isLoading, cart?.items?.length]);

  type MediaRef = { path?: string; url?: string } | null | undefined;
  type UnitInfo = { step?: number | string; suffix?: string; price_prefix?: string; stock_prefix?: string; quantity_prefix?: string };
  type OfferData = { offer_id?: number; offer_name?: string; original_price?: number; discounted_price?: number; discount_amount?: number } | null;
  type CartItemUI = {
    id: number;
    product_name: string;
    product_sku: string;
    product_slug?: string;
    product_variant_id?: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    cart_offer_id?: number | null;
    offer_data?: OfferData;
    product?: { slug?: string; media?: MediaRef[]; unit?: UnitInfo } | null;
    variant?: { id?: number; uid?: string; name?: string; slug?: string; media?: MediaRef[] } | null;
  };

  const items = (cart?.items ?? []) as unknown as CartItemUI[];

  const toQtyNumber = (val: unknown) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  };

  const formatQty = (val: unknown) => {
    const n = toQtyNumber(val);
    const s = n.toFixed(3);
    return s.replace(/\.?0+$/, "");
  };

  const formatMoneyCompact = (v: unknown) => {
    const s = formatPrice(Number(v) || 0);
    return s.replace(/,00$/, "").replace(/\.00$/, "");
  };

  const summaryRows = [
    {
      label: "Ara Toplam",
      value: formatMoneyCompact(cart?.subtotal ?? 0),
    },
  ];

  const handleRemoveItem = (itemId: number) => {
    removeFromCart(itemId);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const getStockPrefix = (unit?: UnitInfo | null) => {
    const stockPrefix = String(unit?.stock_prefix ?? "").trim();
    const quantityPrefix = String(unit?.quantity_prefix ?? "").trim();
    const suffix = String(unit?.suffix ?? "").trim();
    return stockPrefix || quantityPrefix || suffix;
  };

  const getQuantityPrefix = (unit?: UnitInfo | null) => {
    const quantityPrefix = String(unit?.quantity_prefix ?? "").trim();
    const stockPrefix = String(unit?.stock_prefix ?? "").trim();
    const suffix = String(unit?.suffix ?? "").trim();
    return quantityPrefix || stockPrefix || suffix;
  };

  const getVariantLabel = (item: any) => {
    if (item?.variant?.name) return String(item.variant.name);
    const values = item?.variant_values;
    if (Array.isArray(values) && values.length) {
      return values
        .map((v: any) => v?.label || v?.value || v?.name)
        .filter(Boolean)
        .join(", ");
    }
    return "";
  };

  const getOptionsLabel = (options: any) => {
    if (!options) return "";
    if (Array.isArray(options)) {
      return options
        .map((opt: any) => {
          const name = opt?.name || opt?.label || "";
          const val =
            opt?.value ??
            opt?.label ??
            (Array.isArray(opt?.values) ? opt.values.join(", ") : "");
          return name && val ? `${name}: ${val}` : name || val || "";
        })
        .filter(Boolean)
        .join(", ");
    }
    if (typeof options === "object") {
      return Object.entries(options)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
        .join(", ");
    }
    return String(options);
  };

  const whatsappCartEnabled = settings.whatsapp_cart_enabled === "true";
  const whatsappPhone = settings.whatsapp_phone || settings.store_phone || "";
  const whatsappTemplate =
    settings.whatsapp_cart_message_template || DEFAULT_WHATSAPP_CART_TEMPLATE;
  const whatsappButtonText = settings.whatsapp_cart_button_text || "Sepeti WhatsApp’tan Gönder";

  const cartLines = items
    .map((item: any) => {
      const name = item?.product_name || item?.product?.name || "";
      if (!name) return "";
      const variantLabel = getVariantLabel(item);
      const optionsLabel = getOptionsLabel(item?.options);
      const details = [variantLabel, optionsLabel].filter(Boolean).join(", ");
      const detailText = details ? ` (${details})` : "";
      const qty = formatQty(item?.quantity);
      const unitLabel = getQuantityPrefix(item?.product?.unit);
      const unitText = unitLabel ? ` ${unitLabel}` : "";
      const unitPrice = formatMoneyCompact(item?.unit_price);
      const pricePrefix = String(item?.product?.unit?.price_prefix ?? "").trim();
      const priceText = unitPrice ? ` — ${unitPrice}${pricePrefix}` : "";
      return `• ${name}${detailText} x ${qty}${unitText}${priceText}`;
    })
    .filter(Boolean)
    .join("\n");

  const cartRestoreUrl =
    typeof window !== "undefined" ? `${window.location.origin}/sepet` : "/sepet";
  const cartTotal = formatMoneyCompact(cart?.total ?? 0);
  const whatsappMessage = fillTemplate(whatsappTemplate, {
    cart_lines: cartLines,
    cart_total: cartTotal,
    cart_restore_url: cartRestoreUrl,
    item_count: String(items.length),
    store_name: settings.store_name || "",
  });
  const whatsappCartUrl =
    whatsappCartEnabled && items.length > 0 ? buildWhatsAppUrl(whatsappPhone, whatsappMessage) : null;

  if (!isHydrated || (isLoading && !cart)) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse" />
            <div className="h-6 w-32 rounded-md bg-gray-100 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-5 w-28 bg-gray-100 rounded-md animate-pulse mb-4" />
              <div className="space-y-4">
                {[1, 2].map((k) => (
                  <div key={k} className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 bg-gray-100 rounded-md animate-pulse" />
                      <div className="h-3 w-1/3 bg-gray-100 rounded-md animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-5 w-24 bg-gray-100 rounded-md animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((k) => (
                  <div key={k} className="h-4 w-full bg-gray-100 rounded-md animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <h1 className="text-2xl font-bold">Sepetim</h1>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <ShoppingCartOutlined className="text-[36px] text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sepetiniz boş</h2>
            <p className="text-gray-600 mb-6">Sepetinize henüz ürün eklenmemiş.</p>
            <Link href="/" className="inline-block">
              <Button type="primary" size="large">
                Alışverişe Devam Et
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const buildProductHref = (item: CartItemUI) => {
    const productSlug = item?.product?.slug || item?.product_slug || "";
    if (!productSlug) return "/sepet";
    const variantParam = item?.variant?.uid || item?.variant?.id || item?.product_variant_id;
    const query = variantParam ? `?variant=${encodeURIComponent(String(variantParam))}` : "";
    return `/urun/${productSlug}${query}`;
  };

  const columns: ColumnsType<CartItemUI> = [
    {
      title: "Ürün",
      dataIndex: "product",
      key: "product",
      width: 420,
      render: (_: unknown, item: CartItemUI) => (
        <div className="flex gap-4 items-center">
          {/* Product Image */}
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
            {(() => {
              const variantMedia = item?.variant?.media;
              const productMedia = item?.product?.media;
              const base = Array.isArray(variantMedia) && variantMedia.length > 0
                ? variantMedia[0]
                : (Array.isArray(productMedia) && productMedia.length > 0 ? productMedia[0] : null);
              const src = getImageUrl((base as { path?: string; url?: string } | null | undefined)?.path ?? (base as { path?: string; url?: string } | null | undefined)?.url);
              return (
                <Link href={buildProductHref(item)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </Link>
              );
            })()}
          </div>

          {/* Product Info */}
          <div className="min-w-0">
            <div className="min-w-0">
              <h3 className="font-medium text-base truncate">
                <Link
                  href={buildProductHref(item)}
                  className="hover:text-primary transition-colors"
                >
                  {item.product_name}
                </Link>
              </h3>
              {item.variant && (
                <p className="text-sm font-medium text-gray-700 truncate">{item.variant.name}</p>
              )}
              <p className="text-xs text-gray-400">SKU: {item.product_sku}</p>
              {(item as any).offer_data?.offer_name && (
                <div className="mt-1 inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
                  {(item as any).offer_data.offer_name}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: <span className="block text-right">Birim Fiyat</span>,
      dataIndex: "unit_price",
      key: "unit_price",
      align: "right",
      width: 160,
      render: (price: number, item: CartItemUI) => (
        <div className="text-base font-semibold text-gray-900">
          {formatMoneyCompact(price)}
          {String(item?.product?.unit?.price_prefix ?? "").trim()}
        </div>
      ),
    },
    {
      title: <span className="block text-center">Miktar</span>,
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      width: 180,
      render: (quantity: unknown, item: CartItemUI) => {
        const step = Number(item?.product?.unit?.step) || 1;
        const currentQty = toQtyNumber(quantity);
        const canDecrease = currentQty - step >= step;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              disabled={!canDecrease || isLoading}
              onClick={() => updateItemQuantity(item.id, Math.max(step, currentQty - step))}
            >
              −
            </button>
            <div className="flex items-baseline gap-0.5 min-w-[48px] justify-center">
              <span className="text-sm font-semibold tabular-nums text-gray-900">
                {formatQty(quantity)}
              </span>
              {getStockPrefix(item?.product?.unit) ? (
                <span className="text-[11px] font-semibold text-gray-700">
                  {getStockPrefix(item?.product?.unit)}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              disabled={isLoading}
              onClick={() => updateItemQuantity(item.id, currentQty + step)}
            >
              +
            </button>
          </div>
        );
      },
    },
    {
      title: <span className="block text-right">Toplam</span>,
      dataIndex: "total_price",
      key: "total_price",
      align: "right",
      width: 160,
      render: (price: number) => (
        <div className="text-base font-semibold text-gray-900">
          {formatMoneyCompact(price)}
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_: unknown, item: CartItemUI) => (
        <button
          onClick={() => handleRemoveItem(item.id)}
          className="p-1 hover:bg-red-50 rounded transition-colors"
          aria-label="Ürünü kaldır"
        >
          <DeleteOutlined className="text-red-500" />
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">Sepet</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Ürünler</h2>
                  <Button
                    type="text"
                    size="small"
                    onClick={handleClearCart}
                    className="text-gray-500 hover:text-black"
                  >
                    <DeleteOutlined className="mr-1" />
                    Temizle
                  </Button>
                </div>

                {/* Desktop */}
                <div className="hidden lg:block">
                  <Table
                    columns={columns}
                    dataSource={items}
                    rowKey="id"
                    pagination={false}
                    className="cart-table"
                    scroll={{ x: true }}
                  />
                </div>

                {/* Mobile */}
                <div className="lg:hidden space-y-3">
                  {items.map((item) => {
                    const variantMedia = item?.variant?.media;
                    const productMedia = item?.product?.media;
                    const base = Array.isArray(variantMedia) && variantMedia.length > 0
                      ? variantMedia[0]
                      : (Array.isArray(productMedia) && productMedia.length > 0 ? productMedia[0] : null);
                    const src = getImageUrl((base as { path?: string; url?: string } | null | undefined)?.path ?? (base as { path?: string; url?: string } | null | undefined)?.url);
                    const stockPrefix = getStockPrefix(item?.product?.unit);
                    const qtyText = formatQty(item.quantity);
                    const unitPriceText = formatMoneyCompact(item.unit_price);
                    const lineTotalText = formatMoneyCompact(item.total_price);

                    return (
                      <div key={item.id} className="py-4 border-t border-gray-200 first:border-t-0">
                        <div className="relative cart-mobile-item">
                          <button
                            className="absolute top-0 right-0 h-7 w-7 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label="Ürünü kaldır"
                          >
                            <DeleteOutlined />
                          </button>

                          <div className="grid grid-cols-[86px_1fr] gap-4 items-stretch">
                            <Link
                              href={buildProductHref(item)}
                              className="w-[86px] h-[86px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt={item.product_name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            </Link>

                            <div className="min-w-0 pr-8 flex flex-col gap-1">
                              <Link
                                href={buildProductHref(item)}
                                className="block text-[13px] font-semibold text-gray-900 truncate underline decoration-transparent hover:decoration-gray-900"
                              >
                                {item.product_name}
                              </Link>

                              {item.variant?.name ? (
                                <div className="text-[12px] font-medium text-gray-700 mt-0.5 leading-tight truncate">{item.variant.name}</div>
                              ) : null}

                              {(item as any).offer_data?.offer_name && (
                                <div className="mt-0.5 inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
                                  {(item as any).offer_data.offer_name}
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 mt-1">
                                {(() => {
                                  const step = Number(item?.product?.unit?.step) || 1;
                                  const currentQty = toQtyNumber(item.quantity);
                                  const canDecrease = currentQty - step >= step;
                                  return (
                                    <>
                                      <button
                                        type="button"
                                        className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 text-xs font-bold"
                                        disabled={!canDecrease || isLoading}
                                        onClick={() => updateItemQuantity(item.id, Math.max(step, currentQty - step))}
                                      >−</button>
                                      <span className="text-[12px] font-semibold tabular-nums min-w-[28px] text-center">{qtyText}{stockPrefix ? <span className="text-[10px] ml-0.5">{stockPrefix}</span> : null}</span>
                                      <button
                                        type="button"
                                        className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 text-xs font-bold"
                                        disabled={isLoading}
                                        onClick={() => updateItemQuantity(item.id, currentQty + step)}
                                      >+</button>
                                    </>
                                  );
                                })()}
                              </div>

                              <div className="flex items-center justify-between text-[12px] font-semibold text-gray-900 leading-tight">
                                <div className="flex items-baseline gap-1 text-gray-900">
                                  <span className="tabular-nums font-semibold text-gray-900">{qtyText}</span>
                                  {stockPrefix ? <span className="text-[11px] font-semibold text-gray-900 ml-0.5">{stockPrefix}</span> : null}
                                  <span className="text-gray-900 font-bold">×</span>
                                  <span className="tabular-nums font-semibold text-gray-900">{unitPriceText}</span>
                                </div>
                                <span className="font-semibold tabular-nums">{lineTotalText}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <OrderSummaryCard
              title="Özet"
              subtitle="Sipariş bilgileri"
              itemCount={items.length}
              rows={summaryRows}
              totalValue={formatMoneyCompact(cart?.total ?? 0)}
              note="Kupon, İndirimler ve Kargo Ödeme Adımında hesaplanacaktır."
              couponSection={null}
              actions={
                <>
                  <Link
                    href="/checkout"
                    className="block w-full text-center h-12 leading-[48px] rounded-lg font-extrabold text-white"
                    style={{ background: "#6366f1" }}
                  >
                    Ödeme Yap
                  </Link>
                  {whatsappCartUrl ? (
                    <a
                      href={whatsappCartUrl}
                      target="_blank"
                      rel="noopener"
                      className="block w-full text-center h-12 leading-[48px] rounded-lg font-extrabold border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                    >
                      {whatsappButtonText}
                    </a>
                  ) : null}
                  <Link
                    href="/"
                    className="block w-full text-center h-12 leading-[48px] rounded-lg font-extrabold border border-slate-300 text-slate-900 hover:bg-slate-50"
                  >
                    Alışverişe Devam Et
                  </Link>
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
