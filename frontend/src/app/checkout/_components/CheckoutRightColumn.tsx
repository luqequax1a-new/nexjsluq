"use client";

import React from "react";
import Link from "next/link";
import { Button, Checkbox, Radio } from "antd";
import { CouponSection } from "@/components/storefront/cart/CouponSection";
import { OrderSummaryCard } from "@/components/storefront/cart/OrderSummaryCard";

interface CheckoutRightColumnProps {
  paymentMethodsLoading: boolean;
  paymentMethods: any[];
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  shippingMethod: string;
  setShippingMethod: (v: string) => void;
  shippingMethodsLoading: boolean;
  shippingMethods: any[];
  selectedPaymentMethod: any;
  formatMoneyCompact: (v: unknown) => string;
  summaryRows: any[];
  totalValue: string;
  form: any;
  itemsContent: React.ReactNode;
  itemCount: number;
  isSubmitting?: boolean;
  termsAccepted?: boolean;
  setTermsAccepted?: (v: boolean) => void;
}

export function CheckoutRightColumn({
  paymentMethodsLoading,
  paymentMethods,
  paymentMethod,
  setPaymentMethod,
  shippingMethod,
  setShippingMethod,
  shippingMethodsLoading,
  shippingMethods,
  selectedPaymentMethod,
  formatMoneyCompact,
  summaryRows,
  totalValue,
  form,
  itemsContent,
  itemCount,
  isSubmitting = false,
  termsAccepted = false,
  setTermsAccepted,
}: CheckoutRightColumnProps) {
  return (
    <div className="checkout-right">
      <div className="payment-shipping-grid">
        <div className="payment-method">
        <h4 className="title">Ödeme Yöntemi</h4>

        {paymentMethodsLoading ? (
          <div className="payment-method-form">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Ödeme yöntemleri yükleniyor...</p>
            </div>
          </div>
        ) : (
          <div className="payment-method-form">
            <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <div className="space-y-0">
                {paymentMethods.map((method) => (
                  <div key={method.code} className="form-radio">
                    <Radio value={method.code}>
                      <div className="method-row">
                        <div className="method-top">
                          <div className="method-title">{method.name}</div>
                          <div className="method-right">
                            <span className="method-fee">{method.fee_text}</span>
                          </div>
                        </div>
                        {method.description ? (
                          <div className="method-desc" dangerouslySetInnerHTML={{ __html: method.description }} />
                        ) : null}
                      </div>
                    </Radio>
                  </div>
                ))}
              </div>
            </Radio.Group>
          </div>
        )}

        {selectedPaymentMethod?.code === 'bank_transfer' && selectedPaymentMethod?.settings?.bank_info ? (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Banka Hesap Bilgileri</h4>
            <div className="text-sm text-blue-800 whitespace-pre-line">{selectedPaymentMethod.settings.bank_info}</div>
          </div>
        ) : null}
        </div>

        <div className="shipping-method">
        <h4 className="title">Kargo Yöntemi</h4>

        {shippingMethodsLoading ? (
          <div className="shipping-method-form">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Kargo yöntemleri yükleniyor...</p>
            </div>
          </div>
        ) : (
          <div className="shipping-method-form">
            <Radio.Group value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)}>
              <div className="space-y-0">
                {shippingMethods.map((method) => (
                  <div key={method.code} className="form-radio">
                    <Radio value={method.code}>
                      <div className="method-row">
                        <div className="method-top">
                          <div className="method-title">{method.name}</div>
                          <div className="method-right">
                            <span className="method-price">
                              {Number(method.cost) === 0 ? "Ücretsiz" : formatMoneyCompact(method.cost)}
                            </span>
                          </div>
                        </div>
                        {method.free_threshold ? (
                          <div className="method-desc">{formatMoneyCompact(method.free_threshold)}+ ücretsiz</div>
                        ) : null}
                      </div>
                    </Radio>
                  </div>
                ))}
              </div>
            </Radio.Group>
          </div>
        )}
        </div>
      </div>

      <aside className="order-summary-wrap">
        <OrderSummaryCard
          title="Sipariş Özeti"
          subtitle="Sipariş bilgileri"
          itemCount={itemCount}
          itemsContent={itemsContent}
          rows={summaryRows}
          totalValue={totalValue}
          couponSection={<CouponSection />}
          actions={
            <>
              <div className="text-[12px] text-slate-600">
                <Checkbox
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted?.(e.target.checked)}
                >
                  <span>
                    <a href="/terms" target="_blank">Satış Sözleşmesi</a> ni okudum ve kabul ediyorum.
                  </span>
                </Checkbox>
              </div>
              <Button
                type="primary"
                size="large"
                className="w-full h-12 font-extrabold"
                onClick={() => form.submit()}
                loading={isSubmitting}
                disabled={isSubmitting || !termsAccepted}
              >
                Siparişi Tamamla
              </Button>
              <Link
                href="/sepet"
                className="block w-full text-center h-12 leading-[48px] rounded-lg font-extrabold border border-slate-300 text-slate-900 hover:bg-slate-50"
              >
                Sepete Dön
              </Link>
            </>
          }
        />
      </aside>
    </div>
  );
}
