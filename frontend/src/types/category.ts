export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    parent_id?: number;
    image_path?: string;
    is_active: boolean;
    meta_title?: string;
    meta_description?: string;
    position: number;
    type: 'normal' | 'dynamic';
    sort_by: string;
    sort_order: 'asc' | 'desc';
    manual_sort: boolean;
    created_at: string;
    updated_at: string;
    parent?: Category;
    children?: Category[];
    dynamic_rule?: DynamicCategoryRule;
    depth?: number;
}

export interface DynamicCategoryRule {
    id: number;
    category_id: number;
    match_type: 'all' | 'any';
    rules: DynamicRule[];
    created_at: string;
    updated_at: string;
}

export interface DynamicRule {
    condition: 'brand' | 'price' | 'tag' | 'discount' | 'created_date' | 'category' | 'stock';
    method: 'contains' | 'not_contains';
    values: any;
}

export interface CategoryFormData {
    name: string;
    slug?: string;
    description?: string;
    parent_id?: number | null;
    image_path?: string;
    is_active?: boolean;
    meta_title?: string;
    meta_description?: string;
    position?: number;
    type: 'normal' | 'dynamic';
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    manual_sort?: boolean;
    dynamic_rule?: {
        match_type: 'all' | 'any';
        rules: DynamicRule[];
    };
}

export interface CategoryTreeNode extends Category {
    children: CategoryTreeNode[];
}
