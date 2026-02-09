import { apiFetch } from "@/lib/api";
import type { Unit } from "@/hooks/useUnit";

interface HomeData {
    categories: any[];
    hero: any;
    new_arrivals: any[];
}

export async function getHomeData(): Promise<HomeData> {
    return apiFetch("/api/storefront/home", {
        next: { revalidate: 3600 },
    });
}

export async function getCategoryData(slug: string) {
    return apiFetch(`/api/storefront/categories/${encodeURIComponent(String(slug))}`, {
        next: { revalidate: 3600 },
    });
}

export async function getProductData(slug: string) {
    return apiFetch(`/api/storefront/products/${encodeURIComponent(String(slug))}`, {
        cache: "no-store",
    });
}

export async function getPageData(slug: string) {
    return apiFetch(`/api/storefront/pages/${encodeURIComponent(String(slug))}`, {
        next: { revalidate: 10 },
    });
}

export async function getUnits(): Promise<Unit[]> {
    return apiFetch("/api/units", {
        next: { revalidate: 3600 },
    });
}
