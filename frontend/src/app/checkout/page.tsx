"use client";

import { CartProvider } from "@/context/CartContext";
import { CheckoutPageContent } from "./_components/CheckoutPageContent";

export default function CheckoutPage() {
  return (
    <CartProvider>
      <CheckoutPageContent />
    </CartProvider>
  );
}
