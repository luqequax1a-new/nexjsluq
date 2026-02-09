import { apiFetch } from "@/lib/api";

export type ProductTabMatchMode = "any" | "all";

export interface ProductTabConditions {
  match?: ProductTabMatchMode;
  product_ids?: number[];
  category_ids?: number[];
  tag_names?: string[];
  category_mode?: ProductTabMatchMode;
  tag_mode?: ProductTabMatchMode;
}

export interface ProductTab {
  id: number;
  title: string;
  content_html: string | null;
  position: number;
  is_active: boolean;
  conditions: ProductTabConditions | null;
  created_at?: string;
  updated_at?: string;
}

export type ProductTabUpsert = {
  title: string;
  content_html: string | null;
  position: number;
  is_active: boolean;
  conditions: ProductTabConditions | null;
};

export async function listProductTabs(): Promise<{ tabs: ProductTab[] }> {
  return apiFetch("/api/settings/product-tabs", { method: "GET" });
}

export async function getProductTab(id: number): Promise<{ tab: ProductTab }> {
  return apiFetch(`/api/settings/product-tabs/${id}`, { method: "GET" });
}

export async function createProductTab(tab: ProductTabUpsert) {
  return apiFetch("/api/settings/product-tabs", {
    method: "POST",
    json: tab,
  });
}

export async function updateProductTab(id: number, patch: Partial<ProductTabUpsert>) {
  return apiFetch(`/api/settings/product-tabs/${id}`, {
    method: "PUT",
    json: patch,
  });
}

export async function deleteProductTab(id: number) {
  return apiFetch(`/api/settings/product-tabs/${id}`, { method: "DELETE" });
}
