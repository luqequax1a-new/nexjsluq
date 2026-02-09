"use client";

import React, { useState } from "react";
import { Form, message } from "antd";
import { LeftOutlined, LoadingOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { apiFetch, customerApiFetch } from "@/lib/api";
import { TURKEY_PROVINCES, TURKEY_DISTRICTS } from "@/lib/turkey-locations";
import "@/styles/storefront.css";
import styles from "../checkout.module.css";
import { getImageUrl } from "@/lib/media/getImageUrl";

import { CheckoutSteps } from "./CheckoutSteps";
import { ShippingAddressCard } from "./ShippingAddressCard";
import { BillingAddressCard } from "./BillingAddressCard";
import { OrderNotesCard } from "./OrderNotesCard";
import { CheckoutRightColumn } from "./CheckoutRightColumn";

export function CheckoutPageContent() {
  const router = useRouter();
  const { cart, itemCount, isLoading, isHydrated, fetchCart } = useCart();
  const [form] = Form.useForm();
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [selectedCity, setShippingCity] = useState<string | null>(null);
  const [selectedBillingCity, setBillingCity] = useState<string | null>(null);
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [shippingMethodsLoading, setShippingMethodsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const extractApiErrorMessage = (error: any): string => {
    if (!error) return "İşlem sırasında hata oluştu.";
    if (typeof error === "string") return error;
    if (typeof error?.message === "string" && error.message.trim()) return error.message;
    const details = error?.details;
    const errors = details?.errors;
    if (errors && typeof errors === "object") {
      const firstKey = Object.keys(errors)[0];
      const firstVal = firstKey ? errors[firstKey] : null;
      if (Array.isArray(firstVal) && typeof firstVal[0] === "string") return firstVal[0];
      if (typeof firstVal === "string") return firstVal;
    }
    return "İşlem sırasında hata oluştu.";
  };

  // Full page için body class'ını ayarla
  React.useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  // Fetch payment methods
  React.useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setPaymentMethodsLoading(true);
        const data = await apiFetch<any[]>(
          `/api/storefront/payment-methods?amount=${encodeURIComponent(String(cart?.total ?? 0))}`,
          { auth: "none" }
        );
        setPaymentMethods(Array.isArray(data) ? data : []);

        // Set default payment method to first enabled method
        if (data.length > 0 && !paymentMethod) {
          setPaymentMethod(data[0].code);
        }
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
      } finally {
        setPaymentMethodsLoading(false);
      }
    };

    if (cart) {
      fetchPaymentMethods();
    }
  }, [cart]);

  React.useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        setShippingMethodsLoading(true);
        const subtotal = Number(cart?.subtotal ?? 0);
        const url = `/api/storefront/shipping-methods?subtotal=${encodeURIComponent(String(subtotal))}&payment_method=${encodeURIComponent(String(paymentMethod || ""))}`;
        const data = await apiFetch<any[]>(url, { auth: "none" });
        setShippingMethods(Array.isArray(data) ? data : []);

        if (Array.isArray(data) && data.length > 0) {
          const exists = data.some((m: any) => m?.code === shippingMethod);
          if (!exists) setShippingMethod(String(data[0].code));
        }
      } catch (error) {
        console.error('Failed to fetch shipping methods:', error);
      } finally {
        setShippingMethodsLoading(false);
      }
    };

    if (cart) {
      fetchShippingMethods();
    }
  }, [cart, paymentMethod]);

  // Validate coupon on checkout page load
  React.useEffect(() => {
    const validateCoupon = async () => {
      if (!cart?.coupon_id) return;

      try {
        const response = await apiFetch<{ valid: boolean; message?: string }>(
          `/api/cart/validate-coupon`,
          { auth: "customer" }
        );

        if (!response.valid) {
          // Remove invalid coupon
          await apiFetch(`/api/cart/coupon`, {
            method: "DELETE",
            auth: "customer",
          });

          await fetchCart();
          message.warning(response.message || "Kupon geçersiz olduğu için sepetten kaldırıldı.");
        }
      } catch (error) {
        console.error('Failed to validate coupon:', error);
      }
    };

    if (cart) {
      validateCoupon();
    }
  }, [cart?.coupon_id]);

  const normalizeTrPhone = (value: unknown) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    const noLeadingZero = digits.replace(/^0+/, "");
    const ten = noLeadingZero.slice(0, 10);
    return ten ? `+90${ten}` : "";
  };

  const onFinish = async (values: any) => {
    if (submitting) return;
    if (!cart || !cart.items || cart.items.length === 0) {
      message.error("Sepet boş. Lütfen sepetinize ürün ekleyin.");
      return;
    }
    const phone = normalizeTrPhone(values.phone);
    const shippingAddress = {
      first_name: values.first_name,
      last_name: values.last_name,
      phone,
      email: values.email,
      address_line_1: values.shipping_address,
      city: values.shipping_city,
      state: values.shipping_district,
      country: "TR",
    };

    const billingAddress = shipToDifferentAddress
      ? {
        first_name: values.first_name,
        last_name: values.last_name,
        phone,
        email: values.email,
        company: values.billing_company ?? null,
        tax_number: values.billing_tax_number ?? null,
        tax_office: values.billing_tax_office ?? null,
        address_line_1: values.billing_address,
        city: values.billing_city,
        state: values.billing_district,
        country: "TR",
      }
      : shippingAddress;

    const payload = {
      same_as_billing: !shipToDifferentAddress,
      billing_address: billingAddress,
      shipping_address: shipToDifferentAddress ? shippingAddress : null,
      payment_method: paymentMethod,
      shipping_method: shippingMethod,
      customer_note: values.order_notes ?? null,
    };

    try {
      setSubmitting(true);

      const hasCustomerToken = typeof window !== "undefined" && !!localStorage.getItem("customer_token");
      if (createAccount && !hasCustomerToken) {
        const registerPayload = {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          phone,
          password: values.password,
          password_confirmation: values.password,
        };

        const registerRes = await apiFetch<{ token: string }>("/api/storefront/auth/register", {
          method: "POST",
          json: registerPayload,
          auth: "none",
        });

        if (typeof window !== "undefined" && registerRes?.token) {
          localStorage.setItem("customer_token", registerRes.token);
        }

        await fetchCart();
      }

      const res = await customerApiFetch<{ order: { id: number; order_number?: string } }>("/api/storefront/orders", {
        method: "POST",
        json: payload,
      });

      await fetchCart();
      form.resetFields();
      setShipToDifferentAddress(false);
      setCreateAccount(false);

      const orderNo = res?.order?.order_number ?? "";
      const successUrl = orderNo
        ? `/checkout/siparis-tamamlandi?order=${encodeURIComponent(orderNo)}`
        : `/checkout/siparis-tamamlandi`;
      router.push(successUrl);
    } catch (error: any) {
      message.error(extractApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoneyCompact = (v: unknown) => {
    const s = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(v) || 0);
    return s.replace(/,00$/, "").replace(/\.00$/, "");
  };

  const formatQty = (val: unknown) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return "0";
    const s = n.toFixed(3);
    return s.replace(/\.?0+$/, "");
  };

  const getUnitPrefix = (unit?: any) => {
    const stockPrefix = String(unit?.stock_prefix ?? "").trim();
    const quantityPrefix = String(unit?.quantity_prefix ?? "").trim();
    const suffix = String(unit?.suffix ?? "").trim();
    return stockPrefix || quantityPrefix || suffix;
  };

  const getPricePrefix = (unit?: any) => {
    return String(unit?.price_prefix ?? "").trim();
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

  const selectedShippingMethod = shippingMethods.find((m: any) => m?.code === shippingMethod);
  let shippingCost = Number(selectedShippingMethod?.cost ?? 0);

  // Add COD fee if cash on delivery is selected
  const isCOD = paymentMethod === 'cash_on_delivery';
  const codFee = isCOD && selectedShippingMethod?.cod_enabled
    ? Number(selectedShippingMethod?.cod_fee ?? 0)
    : 0;

  if (codFee > 0) {
    shippingCost += codFee;
  }
  const discountTotal = Number(cart?.discount_total ?? 0);
  const subtotal = Number(cart?.subtotal ?? 0);
  const taxTotal = Number(cart?.tax_total ?? 0);
  const selectedPaymentMethod = paymentMethods.find(m => m.code === paymentMethod);
  const paymentFee = Number(selectedPaymentMethod?.fee_amount ?? 0);
  const paymentMethodName = selectedPaymentMethod?.name ?? "";
  const totalWithShipping = Math.max(0, subtotal + taxTotal - discountTotal) + shippingCost + paymentFee;

  const itemsContent = cart?.items?.length ? (
    <>
      {cart.items.map((item) => {
        const qtyText = formatQty(item.quantity);
        const unitPrefix = getUnitPrefix(item?.product?.unit);
        const pricePrefix = getPricePrefix(item?.product?.unit);
        const variantLabel = getVariantLabel(item);
        const variantMedia = item?.variant?.media;
        const productMedia = item?.product?.media;
        const base = Array.isArray(variantMedia) && variantMedia.length > 0
          ? variantMedia[0]
          : (Array.isArray(productMedia) && productMedia.length > 0 ? productMedia[0] : null);
        const src = getImageUrl((base as any)?.path ?? (base as any)?.url);
        const unitPriceText = formatMoneyCompact(item.unit_price);
        const lineTotalText = formatMoneyCompact(item.total_price);
        return (
          <div key={item.id} className="flex gap-3 items-stretch">
            <div className="relative w-[72px] h-[72px] overflow-hidden bg-transparent flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={item.product_name}
                className="w-full h-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-slate-900 truncate">{item.product_name}</div>
                {variantLabel ? (
                  <div className="text-[11px] font-medium text-slate-700 truncate mt-0.5 leading-tight">{variantLabel}</div>
                ) : null}
              </div>

              <div className="flex items-center justify-between text-[12px] font-semibold text-slate-900 leading-tight">
                <div className="flex items-baseline gap-[2px] text-slate-800">
                  <span className="tabular-nums font-semibold text-slate-900">{qtyText}</span>
                  {unitPrefix ? <span className="text-[11px] font-semibold text-slate-900">{unitPrefix}</span> : null}
                  <span className="text-slate-900 font-bold">×</span>
                  <span className="tabular-nums">{unitPriceText}{pricePrefix}</span>
                </div>
                <span className="font-semibold tabular-nums">{lineTotalText}</span>
              </div>
            </div>
          </div>
        );
      })}
    </>
  ) : null;

  const summaryRows = [
    {
      label: "Ara Toplam",
      value: formatMoneyCompact(subtotal),
    },
    ...(taxTotal > 0
      ? [
        {
          label: "KDV",
          value: `+${formatMoneyCompact(taxTotal)}`,
        },
      ]
      : []),
    ...(discountTotal > 0
      ? [
        {
          label: "İndirim",
          value: `-${formatMoneyCompact(discountTotal)}`,
          className: "text-emerald-700",
          labelClassName: "text-emerald-700",
          valueClassName: "text-emerald-700",
        },
      ]
      : []),
    {
      label: "Kargo",
      value: shippingCost === 0 ? "Ücretsiz" : formatMoneyCompact(shippingCost),
      valueClassName: shippingCost === 0 ? "text-emerald-700" : undefined,
    },
    ...(paymentMethodName
      ? [
        {
          label: paymentMethodName,
          value:
            paymentFee === 0
              ? "Ücretsiz"
              : `${paymentFee < 0 ? "-" : "+"}${formatMoneyCompact(Math.abs(paymentFee))}`,
          className: paymentFee < 0 ? "text-emerald-700" : paymentFee > 0 ? "text-orange-600" : undefined,
          labelClassName: paymentFee < 0 ? "text-emerald-700" : paymentFee > 0 ? "text-orange-600" : undefined,
          valueClassName: paymentFee < 0 ? "text-emerald-700" : paymentFee > 0 ? "text-orange-600" : undefined,
        },
      ]
      : []),
  ];

  if (!isHydrated || (isLoading && !cart)) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <LoadingOutlined className="text-5xl text-gray-300" spin />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sayfa yükleniyor</h2>
            <p className="text-gray-600">Lütfen bekleyin...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${styles.checkoutWrap}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 md:hidden">
          <Link
            href="/sepet"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            <LeftOutlined />
            <span>Sepet</span>
          </Link>
        </div>

        <CheckoutSteps />

        <div className="checkout-form">
          <div className="checkout-inner">
            {/* Left Column - Customer Information */}
            <div className="checkout-left">
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                  create_account: false,
                  ship_to_different_address: false
                }}
              >
                <ShippingAddressCard
                  selectedCity={selectedCity}
                  setShippingCity={setShippingCity}
                  shipToDifferentAddress={shipToDifferentAddress}
                  setShipToDifferentAddress={setShipToDifferentAddress}
                  setBillingCity={setBillingCity}
                  provinces={TURKEY_PROVINCES}
                  districtsByProvince={TURKEY_DISTRICTS}
                  form={form}
                  createAccount={createAccount}
                  setCreateAccount={setCreateAccount}
                />

                {shipToDifferentAddress ? (
                  <BillingAddressCard
                    selectedBillingCity={selectedBillingCity}
                    setBillingCity={setBillingCity}
                    provinces={TURKEY_PROVINCES}
                    districtsByProvince={TURKEY_DISTRICTS as any}
                    form={form}
                  />
                ) : null}

                <OrderNotesCard />
              </Form>
            </div>

            {/* Right Column - Payment & Shipping */}
            <CheckoutRightColumn
              paymentMethodsLoading={paymentMethodsLoading}
              paymentMethods={paymentMethods}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              shippingMethod={shippingMethod}
              setShippingMethod={setShippingMethod}
              shippingMethodsLoading={shippingMethodsLoading}
              shippingMethods={shippingMethods}
              selectedPaymentMethod={selectedPaymentMethod}
              formatMoneyCompact={formatMoneyCompact}
              summaryRows={summaryRows}
              totalValue={formatMoneyCompact(totalWithShipping)}
              form={form}
              itemsContent={itemsContent}
              itemCount={cart?.items?.length ?? 0}
              isSubmitting={submitting}
              termsAccepted={termsAccepted}
              setTermsAccepted={setTermsAccepted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
