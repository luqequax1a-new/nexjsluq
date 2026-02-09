import { apiFetch } from "@/lib/api";

export type StorefrontProduct = any;

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export async function getStorefrontProducts(params: {
  q?: string;
  category?: string;
  brand_id?: string | number;
  in_stock?: string | number | boolean;
  sort?: string;
  min?: string | number;
  max?: string | number;
  page?: string | number;
  per_page?: string | number;
} = {}): Promise<Paginated<StorefrontProduct>> {
  const sp = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (!s) return;
    sp.set(k, s);
  });

  const path = `/api/storefront/products${sp.toString() ? `?${sp.toString()}` : ""}`;
  return apiFetch(path, { cache: "no-store" });
}
