import { apiFetch } from "@/lib/api";
import type { Unit } from "@/hooks/useUnit";

export interface ResolvedSection {
    id: number;
    key: string;
    name: string;
    icon: string | null;
    settings: Record<string, any>;
    is_active: boolean;
    position: number;
    resolved_data: Record<string, any>;
}

interface HomeDataDynamic {
    sections: ResolvedSection[];
    is_dynamic: true;
}

interface HomeDataLegacy {
    categories: any[];
    hero: any;
    new_arrivals: any[];
    is_dynamic: false;
}

export type HomeData = HomeDataDynamic | HomeDataLegacy;

export async function getHomeData(): Promise<HomeData> {
    return apiFetch("/api/storefront/home", {
        next: { revalidate: 60 },
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
