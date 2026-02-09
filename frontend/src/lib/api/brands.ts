import { Brand, BrandFormData } from '@/types/brand';
import { apiFetch } from '@/lib/api';

export async function getBrands(params?: {
    search?: string;
    is_active?: boolean;
    paginate?: boolean;
    per_page?: number;
}) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active));
    if (params?.paginate !== undefined) searchParams.set('paginate', String(params.paginate));
    if (params?.per_page) searchParams.set('per_page', String(params.per_page));

    const url = `/api/brands${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiFetch<{ brands: Brand[] }>(url);
}

export async function getBrand(id: number) {
    return apiFetch<{ brand: Brand }>(`/api/brands/${id}`);
}

export async function createBrand(data: BrandFormData) {
    return apiFetch<{ brand: Brand }>('/api/brands', {
        method: 'POST',
        json: data,
    });
}

export async function updateBrand(id: number, data: BrandFormData) {
    return apiFetch<{ brand: Brand }>(`/api/brands/${id}`, {
        method: 'PUT',
        json: data,
    });
}

export async function deleteBrand(id: number) {
    return apiFetch<{ message: string }>(`/api/brands/${id}`, {
        method: 'DELETE',
    });
}

export async function reorderBrands(ids: number[]) {
    return apiFetch<{ message: string }>('/api/brands/reorder', {
        method: 'PUT',
        json: { ids },
    });
}
