"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch, customerApiFetch } from '@/lib/api';
import { App } from 'antd';
import dynamic from 'next/dynamic';

const CartOfferModal = dynamic(() => import('@/components/storefront/cart/CartOfferModal'), { ssr: false });

function extractApiErrorMessage(error: any): string {
  if (!error) return 'İşlem sırasında hata oluştu.';

  if (typeof error === 'string') return error;
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;

  const details = (error as any)?.details;
  const errors = details?.errors;
  if (errors && typeof errors === 'object') {
    const firstKey = Object.keys(errors)[0];
    const firstVal = firstKey ? (errors as any)[firstKey] : null;
    if (Array.isArray(firstVal) && typeof firstVal[0] === 'string') return firstVal[0];
    if (typeof firstVal === 'string') return firstVal;
  }

  try {
    const s = JSON.stringify(error);
    if (s && s !== '{}' && s !== 'null') return s;
  } catch {
    // ignore
  }

  return 'İşlem sırasında hata oluştu.';
}

function normalizeCartPayload(payload: any): Cart | null {
  if (!payload) return null;
  if (payload.cart && typeof payload.cart === "object") return payload.cart as Cart;
  if (payload.data && payload.data.cart) return payload.data.cart as Cart;
  if (payload.items && Array.isArray(payload.items)) return payload as Cart;
  return null;
}

interface CartItem {
  id: number;
  product_id: number;
  product_variant_id?: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  options?: Record<string, any>;
  variant_values?: Record<string, any>;
  product?: {
    id: number;
    name: string;
    slug: string;
    allow_backorder?: boolean;
    in_stock: boolean;
    unit?: {
      type?: string;
      label?: string;
      suffix?: string;
      is_decimal_stock?: boolean;
      min?: number;
      max?: number | null;
      step?: number;
      quantity_prefix?: string | null;
      price_prefix?: string | null;
      stock_prefix?: string | null;
      default_qty?: number | null;
      info_top?: string | null;
      info_bottom?: string | null;
    };
    media?: Array<{
      id: number;
      path: string;
      url?: string;
    }>;
  };
  variant?: {
    id: number;
    uid: string;
    name: string;
    sku: string;
    allow_backorder?: boolean;
    in_stock: boolean;
    media?: Array<{
      id: number;
      path: string;
      url?: string;
    }>;
  };
  saleUnit?: {
    id: number;
    name: string;
  };
}

interface Cart {
  id: number;
  user_id?: number;
  session_id?: string;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  total: number;
  coupon_id?: number;
  coupon_discount: number;
  currency: string;
  items: CartItem[];
}

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  isHydrated: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number, variantId?: number, options?: Record<string, any>) => Promise<void>;
  updateItemQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  checkOffers: (placement?: string, productId?: number) => Promise<void>;
  activeOffer: any | null;
  setActiveOffer: (offer: any | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { message } = App.useApp();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeOffer, setActiveOffer] = useState<any | null>(null);

  const [_backendItemCount, _setBackendItemCount] = useState<number>(0);
  const itemCount = _backendItemCount || cart?.items?.length || 0;

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const res = await customerApiFetch('/api/cart') as any;
      const nextCart = normalizeCartPayload(res);
      setCart(nextCart);
      if (typeof res?.item_count === 'number') _setBackendItemCount(res.item_count);
    } catch (error: any) {
      console.error('Failed to fetch cart:', error);
      // Try localStorage on error
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        const parsedCart = JSON.parse(localCart) as Cart;
        setCart(parsedCart);
        console.log('Using cart from localStorage (fallback)');
      } else {
        setCart(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: number, quantity: number, variantId?: number, options?: Record<string, any>) => {
    try {
      setIsLoading(true);
      const res = await customerApiFetch('/api/cart/items', {
        method: 'POST',
        json: {
          product_id: productId,
          product_variant_id: variantId || null,
          quantity,
          options: options || {},
        },
      }) as any;

      // Update cart state from response
      const nextCart = normalizeCartPayload(res);
      if (nextCart && Array.isArray(nextCart.items)) {
        setCart(nextCart);
        if (typeof res?.item_count === 'number') _setBackendItemCount(res.item_count);
      } else {
        await fetchCart();
      }
      setIsOpen(true);
      message.success('Ürün sepete eklendi!');

      // Check for offers after adding to cart
      setTimeout(() => {
        checkOffers('checkout');
      }, 500);
    } catch (error: any) {
      console.error('Failed to add to cart:', error, {
        message: error?.message,
        status: error?.status,
        details: error?.details,
      });
      message.error(extractApiErrorMessage(error) || 'Ürün sepete eklenirken hata oluştu.');
      // Also fetch cart to ensure state consistency
      await fetchCart();
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemQuantity = async (itemId: number, quantity: number) => {
    try {
      setIsLoading(true);
      const res = await customerApiFetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        json: { quantity },
      }) as any;

      const nextCart = normalizeCartPayload(res);
      if (nextCart) {
        setCart(nextCart);
        if (typeof res?.item_count === 'number') _setBackendItemCount(res.item_count);
      } else {
        await fetchCart();
      }
    } catch (error: any) {
      console.error('Failed to update cart item:', error, {
        message: error?.message,
        status: error?.status,
        details: error?.details,
      });
      message.error(extractApiErrorMessage(error) || 'Sepet güncellenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: number) => {
    try {
      setIsLoading(true);
      const res = await customerApiFetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      }) as any;

      const nextCart = normalizeCartPayload(res);
      if (nextCart) {
        setCart(nextCart);
        if (typeof res?.item_count === 'number') _setBackendItemCount(res.item_count);
      } else {
        await fetchCart();
      }
      message.success('Ürün sepetten kaldırıldı.');
    } catch (error: any) {
      console.error('Failed to remove from cart:', error, {
        message: error?.message,
        status: error?.status,
        details: error?.details,
      });
      message.error(extractApiErrorMessage(error) || 'Ürün sepetten kaldırılırken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);
      const res = await customerApiFetch('/api/cart', {
        method: 'DELETE',
      }) as any;

      const nextCart = normalizeCartPayload(res);
      if (nextCart) {
        setCart(nextCart);
      } else {
        await fetchCart();
      }
      message.success('Sepet temizlendi.');
    } catch (error: any) {
      console.error('Failed to clear cart:', error, {
        message: error?.message,
        status: error?.status,
        details: error?.details,
      });
      message.error(extractApiErrorMessage(error) || 'Sepet temizlenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      setIsLoading(true);
      const res = await customerApiFetch('/api/cart/coupon', {
        method: 'POST',
        json: { code },
      }) as any;

      const nextCart = normalizeCartPayload(res);
      if (nextCart) {
        setCart(nextCart);
      } else {
        await fetchCart();
      }
      message.success('Kupon uygulandı!');
    } catch (error: any) {
      console.error('Failed to apply coupon:', error, {
        message: error?.message,
        status: error?.status,
        details: error?.details,
      });
      message.error(extractApiErrorMessage(error) || 'Kupon uygulanırken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeCoupon = async () => {
    try {
      setIsLoading(true);
      const res = await customerApiFetch('/api/cart/coupon', {
        method: 'DELETE',
      }) as any;

      const nextCart = normalizeCartPayload(res);
      if (nextCart) {
        setCart(nextCart);
      } else {
        await fetchCart();
      }
      message.success('Kupon kaldırıldı.');
    } catch (error: any) {
      console.error('Failed to remove coupon:', error, {
        message: error?.message,
        status: error?.status,
        details: error?.details,
      });
      message.error(extractApiErrorMessage(error) || 'Kupon kaldırılırken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkOffers = async (placement: string = 'checkout', productId?: number) => {
    try {
      // Don't check if an offer is already active
      if (activeOffer) return;

      // For checkout/cart, we need items. For product_page, we might not.
      if (placement !== 'product_page' && !cart?.items?.length) return;

      const params = new URLSearchParams({ placement });
      if (productId) params.append('product_id', String(productId));

      const res = await customerApiFetch(`/api/cart/offers/resolve?${params.toString()}`, {
        method: 'GET',
      }) as any;

      if (res && res.id) {
        setActiveOffer(res);
      }
    } catch (error: any) {
      // Silently ignore offer resolution failures (non-critical)
      if (process.env.NODE_ENV === 'development') {
        console.debug('Offer check skipped:', error?.message || 'no active offers');
      }
    }
  };

  // Fetch cart on mount and initialize session
  useEffect(() => {
    let isMounted = true;
    // Initialize session by making a request to ensure cookies are set
    const initializeSession = async () => {
      try {
        await apiFetch('/sanctum/csrf-cookie');
        await fetchCart();
      } catch (error) {
        console.error('Failed to initialize session:', error);
        // Still try to fetch cart even if CSRF fails
        await fetchCart();
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    };

    initializeSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (cart && cart.items && cart.items.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
      return;
    }
    localStorage.removeItem('cart');
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        isLoading,
        isHydrated,
        isOpen,
        setIsOpen,
        fetchCart,
        addToCart,
        updateItemQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        checkOffers,
        activeOffer,
        setActiveOffer,
      }}
    >
      {children}
      {activeOffer && (
        <CartOfferModal
          offer={activeOffer}
          onClose={() => setActiveOffer(null)}
        />
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
