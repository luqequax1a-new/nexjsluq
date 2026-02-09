import { apiFetch } from "@/lib/api";
import type { Order } from "@/types/order";

export type GuestOrderTrackingPayload = {
  order_number: string;
  email: string;
};

export async function trackGuestOrder(payload: GuestOrderTrackingPayload) {
  return apiFetch<{ order: Order }>("/api/storefront/orders/track", {
    method: "POST",
    json: payload,
    auth: "none",
  });
}
