export interface Brand {
    id: number;
    name: string;
    slug: string;
    description?: string;
    logo_path?: string;
    website?: string;
    is_active: boolean;
    meta_title?: string;
    meta_description?: string;
    position: number;
    created_at: string;
    updated_at: string;
}

export interface BrandFormData {
    name: string;
    slug?: string;
    description?: string;
    logo_path?: string;
    website?: string;
    is_active?: boolean;
    meta_title?: string;
    meta_description?: string;
    position?: number;
}
