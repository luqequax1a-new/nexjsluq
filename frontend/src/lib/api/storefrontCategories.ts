import { apiFetch } from "@/lib/api";

export async function getStorefrontCategoriesTree() {
  return apiFetch(`/api/categories-tree`, { cache: "no-store" });
}
