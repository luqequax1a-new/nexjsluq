export interface Media {
    id: number;
    disk?: string;
    directory?: string;
    filename?: string;
    extension?: string;
    mime_type?: string;
    mime?: string | null;
    size?: number;
    width?: number | null;
    height?: number | null;
    focal_x?: number | null;
    focal_y?: number | null;
    path: string;
    url?: string;
    thumb_url?: string;
    thumb_path?: string | null;
    scope: 'product' | 'variant' | 'global';
    position?: number;
}

export interface OptionValue {
    id: number;
    label: string;
    value: string;
    color_hex?: string;
    image_url?: string;
}

export interface Option {
    id: number;
    name: string;
    position: number;
    values: OptionValue[];
}

export interface ProductVariant {
    id: number;
    uid: string; // FleetCart-style unique identifier
    uids: string; // Combined variation value UIDs like "abc123.def456"
    product_id: number;
    name?: string;
    price?: number;
    special_price?: number | null;
    special_price_type?: 'fixed' | 'percent' | null;
    special_price_start?: string | null;
    special_price_end?: string | null;
    selling_price?: number;
    sku?: string;
    gtin?: string;
    qty?: number;
    allow_backorder?: boolean;
    in_stock: boolean;
    is_active: boolean;
    is_default: boolean;
    position: number;
    media: Media[];
    // Computed attributes
    base_image?: Media | null;
    has_special_price?: boolean;
    is_in_stock?: boolean;
    is_out_of_stock?: boolean;
}

export interface Brand {
    id: number;
    name: string;
    slug: string;
    logo?: string;
}

export interface VariationValue {
    id: number;
    uid: string;
    variation_id: number;
    label: string;
    value?: string;
    color?: string;
    image?: { id: number; path: string; url?: string } | null;
    position: number;
}

export interface Variation {
    id: number;
    uid: string;
    name: string;
    type: 'text' | 'color' | 'image' | 'button' | 'dropdown' | 'pill' | 'radio';
    is_global: boolean;
    position: number;
    values: VariationValue[];
}

export interface ProductAttributeValue {
    id: number;
    product_attribute_id: number;
    attribute_value_id: number;
    value?: string;
}

export interface ProductAttribute {
    id: number;
    product_id: number;
    attribute_id: number;
    name?: string;
    attribute_set?: string;
    values: ProductAttributeValue[];
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    selling_price: number;
    discount_rate?: number;
    short_description?: string;
    description?: string;
    sku: string;
    gtin?: string;
    qty?: number;
    allow_backorder?: boolean;
    in_stock: boolean;
    is_active: boolean;
    brand?: Brand;
    categories?: Category[];
    media: Media[];
    variants: ProductVariant[];
    variations: Variation[]; // FleetCart-style variations
    options: Option[];
    attributes?: ProductAttribute[];
    unit?: {
        type?: string;
        label?: string;
        suffix?: string;
        min?: number;
        max?: number | null;
        step?: number;
        default_qty?: number;
        info_top?: string | null;
        info_bottom?: string | null;
        price_prefix?: string | null;
        stock_prefix?: string | null;
        is_decimal_stock?: boolean;
    };
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    image?: string;
    parent_id?: number;
}
