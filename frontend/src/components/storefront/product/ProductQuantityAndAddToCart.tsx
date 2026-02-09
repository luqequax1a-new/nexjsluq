"use client";

import React, { useState, useEffect } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { MessageCircle, ShoppingBag, Bell, CheckCircle, AlertTriangle } from "lucide-react";
import { message } from "antd";
import { useCart } from "@/context/CartContext";
import { useStorefrontSettings } from "@/context/StorefrontSettingsContext";
import { apiFetch } from "@/lib/api";
import {
  DEFAULT_WHATSAPP_PRODUCT_TEMPLATE,
  buildWhatsAppUrl,
  fillTemplate,
} from "@/lib/whatsapp";

export interface ProductQuantityAndAddToCartProps {
  showDecimalQuantityCard: boolean;
  unitLabel: string;
  unitName: string;
  unit: any;
  quantity: number;
  setQuantity: (next: number) => void;
  isDecimalAllowed: boolean;
  isEditingQty: boolean;
  qtyInput: string;
  setQtyInput: (next: string) => void;
  minQty: number;
  maxQty: number | null;
  stepQty: number;
  chips: number[];
  displayChipSuffix: string;
  normalizeQtyStep: (n: number) => number;
  parseQtyInput: (raw: string) => number | null;
  sanitizeQtyInput: (raw: string) => string;
  formatQtyForOverlay: (qty: number) => string;
  beginEditQty: () => void;
  cancelEditQty: () => void;
  commitEditQty: () => void;
  incrementQty: () => void;
  decrementQty: () => void;
  product: any;
  selectedVariant: any;
  selectedExtraOptions: Record<number, number>;
}

export function ProductQuantityAndAddToCart({
  showDecimalQuantityCard,
  unitLabel,
  unitName,
  unit,
  quantity,
  setQuantity,
  isDecimalAllowed,
  isEditingQty,
  qtyInput,
  setQtyInput,
  minQty,
  maxQty,
  stepQty,
  chips,
  displayChipSuffix,
  normalizeQtyStep,
  parseQtyInput,
  sanitizeQtyInput,
  formatQtyForOverlay,
  beginEditQty,
  cancelEditQty,
  commitEditQty,
  incrementQty,
  decrementQty,
  product,
  selectedVariant,
  selectedExtraOptions,
}: ProductQuantityAndAddToCartProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart, setIsOpen } = useCart();
  const { settings } = useStorefrontSettings();

  // Reset quantity to default quantity ONLY when variant changes (not continuously)
  useEffect(() => {
    if (unit) {
      const defaultQty = unit?.default_qty ?? minQty;
      setQuantity(defaultQty);
      setQtyInput(String(defaultQty));
    }
  }, [selectedVariant?.id, unit?.default_qty, minQty, setQuantity, setQtyInput]);

  const handleAddToCart = async () => {
    if (isAddingToCart) return;

    const resolvedProductId = Number((product as any)?.id ?? (product as any)?.product_id ?? 0);
    if (!Number.isFinite(resolvedProductId) || resolvedProductId <= 0) {
      message.error('Ürün bulunamadı (product id eksik).');
      return;
    }

    // Debug: log variant info
    console.log('AddToCart debug:', {
      productId: resolvedProductId,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      quantity,
      options: selectedExtraOptions,
    });

    const allowBackorder = Boolean(selectedVariant?.allow_backorder ?? product?.allow_backorder);

    // Check stock only when backorder is disabled.
    const stockQuantity = selectedVariant?.qty || product?.qty || 0;
    if (!allowBackorder && quantity > stockQuantity) {
      message.error('Stok miktarından fazla ürün ekleyemezsiniz.');
      return;
    }

    const optionList = Array.isArray((product as any)?.options) ? (product as any).options : [];
    const optionPayload = Object.entries(selectedExtraOptions || {})
      .map(([optionId, valueId]) => {
        const option = optionList.find((o: any) => Number(o?.id) === Number(optionId));
        const value = Array.isArray(option?.values)
          ? option.values.find((v: any) => Number(v?.id) === Number(valueId))
          : null;
        if (!option || !value) return null;
        return {
          option_id: Number(option.id),
          value_id: Number(value.id),
          name: String(option.name ?? option.label ?? ""),
          value: String(value.label ?? value.value ?? value.name ?? ""),
        };
      })
      .filter(Boolean) as Array<{ option_id: number; value_id: number; name: string; value: string }>;
    const optionsForCart = optionPayload.length > 0 ? optionPayload : selectedExtraOptions || {};

    setIsAddingToCart(true);
    
    try {
      await addToCart(resolvedProductId, quantity, selectedVariant?.id || undefined, optionsForCart);
      setIsOpen(true);
      
      // Reset quantity to default after successful add to cart
      const defaultQty = unit?.default_qty ?? minQty;
      setQuantity(defaultQty);
      setQtyInput(String(defaultQty));
    } catch (error: any) {
      console.error('Add to cart error:', error);
      message.error(error.message || 'Ürün sepete eklenirken hata oluştu.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const formatQty = (val: unknown) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return "0";
    const s = n.toFixed(3);
    return s.replace(/\.?0+$/, "");
  };

  const formatMoneyCompact = (v: unknown) => {
    const s = formatPrice(Number(v) || 0);
    return s.replace(/,00$/, "").replace(/\.00$/, "");
  };

  const whatsappEnabled = settings.whatsapp_product_enabled === "true";
  const whatsappPhone = settings.whatsapp_phone || settings.store_phone || "";
  const whatsappTemplate =
    settings.whatsapp_product_message_template || DEFAULT_WHATSAPP_PRODUCT_TEMPLATE;
  const whatsappButtonText = settings.whatsapp_product_button_text || "WhatsApp'tan Sor";

  const quantityPrefixRaw = String(unit?.quantity_prefix ?? "").trim();
  const stockPrefixRaw = String(unit?.stock_prefix ?? "").trim();
  const suffixRaw = String(unit?.suffix ?? "").trim();
  const quantityPrefix = quantityPrefixRaw || stockPrefixRaw || suffixRaw;
  const stockPrefix = stockPrefixRaw || quantityPrefixRaw || suffixRaw;
  const pricePrefix = String(unit?.price_prefix ?? "").trim();
  const productUrl = typeof window !== "undefined" ? window.location.href : "";

  const priceValue =
    selectedVariant?.selling_price ??
    selectedVariant?.price ??
    product?.selling_price ??
    product?.price ??
    0;

  const whatsappMessage = fillTemplate(whatsappTemplate, {
    product_name: product?.name || "",
    product_sku: product?.sku || "",
    variant_name: selectedVariant?.name || "",
    variant_sku: selectedVariant?.sku || "",
    quantity: formatQty(quantity),
    quantity_prefix: quantityPrefix,
    stock_prefix: stockPrefix,
    price: formatMoneyCompact(priceValue),
    price_prefix: pricePrefix,
    product_url: productUrl,
    store_name: settings.store_name || "",
  });

  const whatsappUrl = whatsappEnabled ? buildWhatsAppUrl(whatsappPhone, whatsappMessage) : null;

  const whatsappButton = whatsappUrl ? (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener"
      className="mt-3 w-full h-11 rounded-lg border border-emerald-600 text-emerald-700 font-extrabold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
    >
      <MessageCircle className="w-5 h-5" />
      {whatsappButtonText}
    </a>
  ) : null;

  const variantQty = Number(selectedVariant?.qty ?? product?.qty ?? 0);
  const manageStock = !(selectedVariant?.allow_backorder ?? product?.allow_backorder);
  const isInStock = Boolean(selectedVariant?.in_stock ?? product?.in_stock)
    || Boolean(selectedVariant?.allow_backorder ?? product?.allow_backorder);
  const effectiveMaxQty = manageStock && variantQty > 0 ? Math.min(maxQty ?? Infinity, variantQty) : maxQty;

  const isQtyIncreaseDisabled = !isInStock
    || (effectiveMaxQty !== null && effectiveMaxQty !== Infinity && quantity >= effectiveMaxQty);
  const isQtyDecreaseDisabled = !isInStock || quantity <= minQty;

  // Chip disabled: stok yönetimi varsa ve stok < chip değeri
  const isChipDisabled = (chipValue: number) => {
    if (!isInStock) return true;
    if (manageStock && variantQty > 0 && chipValue > variantQty) return true;
    if (chipValue < minQty) return true;
    return false;
  };

  // Stock notify state — remember which product+variant combos have been notified
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifiedKeys, setNotifiedKeys] = useState<Set<string>>(new Set());
  const [notifyError, setNotifyError] = useState('');

  const notifyKey = `${product?.id ?? 0}-${selectedVariant?.id ?? 'base'}`;
  const alreadyNotified = notifiedKeys.has(notifyKey);

  // Clear error when variant changes, but keep notifiedKeys
  useEffect(() => {
    setNotifyError('');
  }, [selectedVariant?.id]);

  const handleStockNotify = async () => {
    if (!notifyEmail || notifySubmitting || alreadyNotified) return;
    setNotifySubmitting(true);
    setNotifyError('');
    try {
      await apiFetch('/api/storefront/stock-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product?.id,
          variant_id: selectedVariant?.id || null,
          email: notifyEmail,
        }),
      });
      setNotifiedKeys(prev => new Set(prev).add(notifyKey));
    } catch (err: any) {
      setNotifyError(err?.message || 'İşlem başarısız.');
    } finally {
      setNotifySubmitting(false);
    }
  };

  return (
    <div className="pt-4">
      {!isInStock ? (
        /* Out of Stock: hide quantity, show only notify form */
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <h4 className="text-[15px] font-semibold text-gray-900">Bu Ürün Şu An Stokta Yok</h4>
          </div>
          <p className="text-[13px] text-gray-500 mb-4">
            E-posta adresinizi bırakın, ürün tekrar stoklara girdiğinde size haber verelim.
          </p>

          {alreadyNotified ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>Talebiniz alındı. Ürün stok açıldığında size haber vereceğiz.</span>
            </div>
          ) : (
            <>
              <div className="flex gap-0">
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="E-posta adresiniz"
                  disabled={notifySubmitting}
                  className="flex-1 h-12 px-4 rounded-l-lg border border-r-0 border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:opacity-50"
                  onKeyDown={(e) => e.key === 'Enter' && handleStockNotify()}
                />
                <button
                  type="button"
                  onClick={handleStockNotify}
                  disabled={notifySubmitting || !notifyEmail}
                  className="h-12 px-6 rounded-r-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {notifySubmitting ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                  Haber Ver
                </button>
              </div>
              {notifyError && (
                <div className="mt-2 text-sm text-red-600">{notifyError}</div>
              )}
            </>
          )}
          {whatsappButton}
        </div>
      ) : showDecimalQuantityCard ? (
        <div className="decimal-quantity-card">
          <div className="decimal-quantity-header">
            <div>
              <div className="decimal-quantity-title">
                <span>{unitLabel || "Uzunluk"}</span>
                {unitName ? (
                  <>
                    {" "}
                    (<span>{unitName}</span>)
                  </>
                ) : null}
              </div>
              <div className="decimal-quantity-desc">{unit?.info_top || ""}</div>
            </div>
          </div>

          <div className="decimal-quantity-main">
            <button
              type="button"
              className="btn-quantity minus"
              disabled={isQtyDecreaseDisabled}
              onClick={decrementQty}
            >
              −
            </button>

            <div className="decimal-quantity-input">
              <span className="input-overlay">
                {formatQtyForOverlay(quantity)}
                {displayChipSuffix}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={isEditingQty ? qtyInput : String(quantity)}
                autoComplete="off"
                min={minQty}
                max={effectiveMaxQty ?? undefined}
                id="qty"
                aria-label="Miktar"
                className="form-control input-quantity-decimal input-overlay-target"
                disabled={!isInStock}
                onFocus={(e) => {
                  beginEditQty();
                  queueMicrotask(() => e.currentTarget.select());
                }}
                onBlur={() => {
                  if (isEditingQty) commitEditQty();
                }}
                onChange={(e) => {
                  try {
                    if (e?.target?.value) {
                      setQtyInput(sanitizeQtyInput(e.target.value));
                    }
                  } catch (error) {
                    console.warn('Input change error:', error);
                  }
                }}
                onKeyDown={(e) => {
                  if (!e) return;
                  
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitEditQty();
                    return;
                  }

                  if (e.key === "Escape") {
                    e.preventDefault();
                    cancelEditQty();
                    return;
                  }

                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    incrementQty();
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    decrementQty();
                  }
                }}
              />
              <span className="input-suffix">{unit?.suffix || ""}</span>
            </div>

            <button
              type="button"
              className="btn-quantity plus"
              disabled={isQtyIncreaseDisabled}
              onClick={incrementQty}
            >
              +
            </button>
          </div>

          <div className="decimal-quantity-chips">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                className={cn("chip", c === 5 ? "chip--desktop-only" : "")}
                disabled={isChipDisabled(c)}
                onClick={() => setQuantity(normalizeQtyStep(c))}
              >
                {c}
                <span>{displayChipSuffix}</span>
              </button>
            ))}
          </div>

          <div className="decimal-quantity-info">{unit?.info_bottom || ""}</div>

          <button 
            className="btn btn-primary btn-add-to-cart"
            onClick={handleAddToCart}
            disabled={isAddingToCart || !isInStock}
          >
            <ShoppingBag className="w-5 h-5" />
            {isAddingToCart ? 'Ekleniyor...' : 'Sepete Ekle'}
          </button>
          {whatsappButton}
        </div>
      ) : (
        <div className="decimal-quantity-card">
          <div className="decimal-quantity-header">
            <div>
              <div className="decimal-quantity-title">
                <span>{unitLabel || "Miktar"}</span>
                {unitName ? (
                  <>
                    {" "}
                    (<span>{unitName}</span>)
                  </>
                ) : null}
              </div>
              <div className="decimal-quantity-desc">{unit?.info_top || ""}</div>
            </div>
          </div>

          <div className="decimal-quantity-main">
            <button
              type="button"
              className="btn-quantity minus"
              disabled={isQtyDecreaseDisabled}
              onClick={decrementQty}
            >
              -
            </button>

            <div className="decimal-quantity-input">
              <span className="input-overlay">
                {formatQtyForOverlay(quantity)}
                {displayChipSuffix}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={isEditingQty ? qtyInput : String(quantity)}
                autoComplete="off"
                min={minQty}
                max={effectiveMaxQty ?? undefined}
                id="qty"
                aria-label="Miktar"
                className="form-control input-quantity-decimal input-overlay-target"
                disabled={!isInStock}
                onFocus={(e) => {
                  beginEditQty();
                  queueMicrotask(() => e.currentTarget.select());
                }}
                onBlur={() => {
                  if (isEditingQty) commitEditQty();
                }}
                onChange={(e) => {
                  try {
                    if (e?.target?.value) {
                      setQtyInput(sanitizeQtyInput(e.target.value));
                    }
                  } catch (error) {
                    console.warn('Input change error:', error);
                  }
                }}
                onKeyDown={(e) => {
                  if (!e) return;
                  
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitEditQty();
                    return;
                  }

                  if (e.key === "Escape") {
                    e.preventDefault();
                    cancelEditQty();
                    return;
                  }

                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    incrementQty();
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    decrementQty();
                  }
                }}
              />
              <span className="input-suffix">{unit?.suffix || ""}</span>
            </div>

            <button
              type="button"
              className="btn-quantity plus"
              disabled={isQtyIncreaseDisabled}
              onClick={incrementQty}
            >
              +
            </button>
          </div>

          <div className="decimal-quantity-info">{unit?.info_bottom || ""}</div>

          <button 
            className="btn btn-primary btn-add-to-cart"
            onClick={handleAddToCart}
            disabled={isAddingToCart || !isInStock}
          >
            <ShoppingBag className="w-5 h-5" />
            {isAddingToCart ? 'Ekleniyor...' : 'Sepete Ekle'}
          </button>
          {whatsappButton}
        </div>
      )}
    </div>
  );
}
