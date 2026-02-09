"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import { HeaderIcons } from "@/components/storefront/header/HeaderIcons";
import Link from "next/link";
import { Button, Empty } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { formatPrice, formatCount } from "@/lib/utils";
import { getImageUrl } from "@/lib/media/getImageUrl";

type MediaRef = { path?: string; url?: string } | null | undefined;
type UnitInfo = { step?: number | string; suffix?: string; price_prefix?: string; stock_prefix?: string; quantity_prefix?: string };
type OfferData = {
  offer_id?: number;
  offer_name?: string;
  original_price?: number;
  discounted_price?: number;
  discount_amount?: number;
  discount_type?: string;
  discount_value?: number;
} | null;
type CartItemUI = {
  id: number;
  product_name: string;
  product_sku: string;
  product_slug?: string;
  product_variant_id?: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  options?: any;
  variant_values?: any;
  cart_offer_id?: number | null;
  offer_data?: OfferData;
  product?: { 
    slug: string;
    unit?: UnitInfo; 
    media?: MediaRef[] 
  } | null;
  variant?: { 
    id?: number;
    uid?: string;
    name?: string; 
    media?: MediaRef[] 
  } | null;
};

export function SidebarCart() {
  const { cart, itemCount, isOpen, setIsOpen, removeFromCart } = useCart();
  const items = (cart?.items ?? []) as unknown as CartItemUI[];
  const drawerRef = React.useRef<HTMLDivElement | null>(null);

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

  const getStockPrefix = (unit?: UnitInfo | null) => {
    const stockPrefix = String(unit?.stock_prefix ?? "").trim();
    const quantityPrefix = String(unit?.quantity_prefix ?? "").trim();
    const suffix = String(unit?.suffix ?? "").trim();
    return stockPrefix || quantityPrefix || suffix;
  };

  const getVariantLabel = (item: CartItemUI) => {
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

  const buildProductHref = (item: CartItemUI) => {
    const productSlug = item?.product?.slug || item?.product_slug || "";
    if (!productSlug) return "/sepet";
    const variantParam = item?.variant?.uid || item?.variant?.id || item?.product_variant_id;
    const query = variantParam ? `?variant=${encodeURIComponent(String(variantParam))}` : "";
    return `/urun/${productSlug}${query}`;
  };

  React.useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) return;
    const active = document.activeElement as HTMLElement | null;
    if (active && drawerRef.current?.contains(active)) {
      active.blur();
    }
  }, [isOpen]);

  const handleRemoveItem = (itemId: number) => {
    removeFromCart(itemId);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={
          "fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 " +
          (isOpen ? "opacity-100 visible pointer-events-auto z-[10100]" : "opacity-0 invisible pointer-events-none z-[10100]")
        }
        onClick={() => setIsOpen(false)}
      />
      
      {/* Sidebar */}
      <div
        className={
          "fixed right-0 top-0 h-screen w-full max-w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[10110] " +
          (isOpen ? "translate-x-0" : "translate-x-full")
        }
        aria-hidden={!isOpen}
        inert={!isOpen}
        ref={drawerRef}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
            <div className="relative text-[20px] font-medium leading-7">
              Sepetim
              <span className="absolute -top-1 -right-5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                {formatCount(itemCount)}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 opacity-80 hover:opacity-100 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Kapat"
            >
              <HeaderIcons.Close className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-5 py-2">
            {!cart || !cart.items || cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Sepetiniz boş"
                />

                <Link href="/" className="w-full">
                  <Button size="large" className="w-full" onClick={() => setIsOpen(false)}>
                    Alışverişe Devam Et
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="py-2">
                {items.map((item) => (
                  <div key={item.id} className="py-4 border-b border-slate-200 last:border-b-0">
                    <div className="flex gap-4 items-stretch">
                      {/* Product Image */}
                      <Link 
                        href={buildProductHref(item)}
                        className="w-[80px] h-[80px] bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border border-slate-200 block"
                        onClick={() => setIsOpen(false)}
                      >
                        {(() => {
                          const variantMedia = item?.variant?.media;
                          const productMedia = item?.product?.media;
                          const base = Array.isArray(variantMedia) && variantMedia.length > 0
                            ? variantMedia[0]
                            : (Array.isArray(productMedia) && productMedia.length > 0 ? productMedia[0] : null);
                          const src = getImageUrl((base as { path?: string; url?: string } | null | undefined)?.path ?? (base as { path?: string; url?: string } | null | undefined)?.url);
                          return (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={src}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          );
                        })()}
                      </Link>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link 
                              href={buildProductHref(item)}
                              className="block"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="text-[15px] font-semibold text-slate-900 truncate hover:text-blue-600 transition-colors">
                                {item.product_name}
                              </div>
                              {(() => {
                                const variantLabel = getVariantLabel(item);
                                const optionsLabel = getOptionsLabel(item.options);
                                const detailText = [variantLabel, optionsLabel].filter(Boolean).join(" - ");
                                return detailText ? (
                                  <div className="text-[12px] font-medium text-slate-700 truncate mt-0.5 leading-tight">
                                    {detailText}
                                  </div>
                                ) : null;
                              })()}
                            </Link>
                            {item.offer_data?.offer_name && (
                              <div className="mt-1 inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
                                {item.offer_data.offer_name}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
                            aria-label="Ürünü kaldır"
                          >
                            <DeleteOutlined className="text-sm text-slate-700" />
                          </button>
                        </div>

                        <div className="mt-0.5 flex items-center justify-between text-[12px] font-semibold text-slate-900 leading-tight">
                          {(() => {
                            const qty = formatQty(item.quantity);
                            const stockPrefix = getStockPrefix(item?.product?.unit);
                            const unitPrice = formatMoneyCompact(item.unit_price);
                            const pricePrefix = String(item?.product?.unit?.price_prefix ?? "").trim();
                            const lineTotal = formatMoneyCompact(item.total_price);
                            return (
                              <>
                                <div className="flex items-baseline gap-[2px] text-slate-800">
                                  <span className="tabular-nums font-semibold text-slate-900">{qty}</span>
                                  {stockPrefix ? <span className="text-[11px] font-semibold text-slate-900">{stockPrefix}</span> : null}
                                  <span className="text-slate-900 font-bold">×</span>
                                  <span className="tabular-nums font-semibold text-slate-900">{unitPrice}{pricePrefix}</span>
                                </div>
                                <span className="font-semibold tabular-nums">{lineTotal}</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart && cart.items && cart.items.length > 0 && (
            <div className="border-t bg-white px-5 py-4">
              <div className="flex items-center justify-between text-[15px] font-semibold">
                <span>Ara Toplam</span>
                <span className="tabular-nums">{formatMoneyCompact(cart.subtotal)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Link href="/sepet" className="w-full">
                  <Button size="large" className="w-full" onClick={() => setIsOpen(false)}>
                    Sepeti Gör
                  </Button>
                </Link>
                <Link href="/checkout" className="w-full">
                  <Button type="primary" size="large" className="w-full" onClick={() => setIsOpen(false)}>
                    Ödeme
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
