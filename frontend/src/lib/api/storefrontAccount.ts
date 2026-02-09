import { customerApiFetch } from "@/lib/api";
import type { CustomerAddress, Order, PaginatedResponse, Customer } from "@/types/order";

export type CustomerAddressPayload = Partial<CustomerAddress> & {
  first_name: string;
  last_name: string;
  address_line_1: string;
  city: string;
};

export async function getCustomerAddresses() {
  return customerApiFetch<{
    addresses: CustomerAddress[];
    default_shipping_id?: number | null;
    default_billing_id?: number | null;
  }>("/api/storefront/account/addresses");
}

export async function createCustomerAddress(payload: CustomerAddressPayload) {
  return customerApiFetch<{ address: CustomerAddress }>("/api/storefront/account/addresses", {
    method: "POST",
    json: payload,
  });
}

export async function updateCustomerAddress(id: number, payload: Partial<CustomerAddressPayload>) {
  return customerApiFetch<{ address: CustomerAddress }>(`/api/storefront/account/addresses/${id}`, {
    method: "PUT",
    json: payload,
  });
}

export async function deleteCustomerAddress(id: number) {
  return customerApiFetch<{ ok: boolean }>(`/api/storefront/account/addresses/${id}`, {
    method: "DELETE",
  });
}

export async function getCustomerCoupons() {
  return customerApiFetch<{
    coupons: Array<{
      coupon: any;
      used_count: number;
      remaining_usage: number | null;
    }>;
  }>("/api/storefront/account/coupons");
}

export async function getCustomerOrders(params?: { page?: number; per_page?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.per_page) qs.set("per_page", String(params.per_page));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return customerApiFetch<PaginatedResponse<Order>>(`/api/storefront/account/orders${suffix}`);
}

export async function getCustomerOrder(id: number) {
  return customerApiFetch<{ order: Order }>(`/api/storefront/account/orders/${id}`);
}

export async function getCustomerProfile() {
  return customerApiFetch<{ customer: Customer }>("/api/storefront/account/profile");
}

export async function updateCustomerProfile(payload: Partial<Customer> & {
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}) {
  return customerApiFetch<{ customer: Customer }>("/api/storefront/account/profile", {
    method: "PUT",
    json: payload,
  });
}
