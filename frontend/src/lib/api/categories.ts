import { Category, CategoryFormData, CategoryTreeNode } from '@/types/category';
import { apiFetch } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getCategories(params?: {
    type?: 'normal' | 'dynamic';
    search?: string;
    is_active?: boolean;
    parent_id?: number | 'null';
    paginate?: boolean;
    per_page?: number;
}) {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active));
    if (params?.parent_id !== undefined) searchParams.set('parent_id', String(params.parent_id));
    if (params?.paginate !== undefined) searchParams.set('paginate', String(params.paginate));
    if (params?.per_page) searchParams.set('per_page', String(params.per_page));

    const url = `/api/categories${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiFetch(url);
}

export async function getCategoryTree(type: 'normal' | 'dynamic' = 'normal'): Promise<{ categories: CategoryTreeNode[] }> {
    return apiFetch(`/api/categories-tree?type=${type}`);
}

export async function getCategory(id: number) {
    return apiFetch(`/api/categories/${id}`);
}

export async function createCategory(data: CategoryFormData) {
    return apiFetch(`/api/categories`, {
        method: 'POST',
        json: data,
    });
}

export async function updateCategory(id: number, data: CategoryFormData) {
    return apiFetch(`/api/categories/${id}`, {
        method: 'PUT',
        json: data,
    });
}

export async function deleteCategory(id: number) {
    return apiFetch(`/api/categories/${id}`, {
        method: 'DELETE',
    });
}

export async function reorderCategories(ids: number[]) {
    return apiFetch(`/api/categories/reorder`, {
        method: 'PUT',
        json: { ids },
    });
}

export async function attachProductsToCategory(categoryId: number, productIds: number[], isPrimary: boolean = false) {
    return apiFetch(`/api/categories/${categoryId}/attach-products`, {
        method: 'POST',
        json: { product_ids: productIds, is_primary: isPrimary },
    });
}

export async function detachProductsFromCategory(categoryId: number, productIds: number[]) {
    return apiFetch(`/api/categories/${categoryId}/detach-products`, {
        method: 'POST',
        json: { product_ids: productIds },
    });
}

export async function syncDynamicCategory(categoryId: number) {
    return apiFetch(`/api/categories/${categoryId}/sync-dynamic`, {
        method: 'POST',
    });
}
