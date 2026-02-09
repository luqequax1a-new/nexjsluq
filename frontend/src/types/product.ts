export interface MediaImage {
    id: number;
    path: string;
    url?: string;
}

export interface VariationValue {
    id: number;
    uid: string; // FleetCart-style unique identifier
    variation_id: number;
    label: string;
    value?: string; // Used for color hex in FleetCart style
    color?: string; // Explicit color field
    image_id?: number | null;
    image?: MediaImage | null; // Computed from imageMedia relation
    position: number;
}

export type VariationType = 'text' | 'color' | 'image' | 'button' | 'dropdown' | 'pill' | 'radio';

export interface Variation {
    id: number;
    uid: string; // FleetCart-style unique identifier
    name: string;
    type: VariationType;
    is_global: boolean;
    position: number;
    values: VariationValue[];
}

export type OptionType = 'field' | 'textarea' | 'dropdown' | 'checkbox' | 'checkbox_custom' | 'radio' | 'radio_custom' | 'multiple_select' | 'date' | 'date_time' | 'time' | 'file';

export interface OptionValue {
    id?: number;
    option_id?: number;
    label: string;
    price?: number | null;
    price_type: 'fixed' | 'percent';
    position?: number;
    uid?: string; // UI friendly ID
}

export interface ProductOption {
    id?: number;
    uid?: string; // UI friendly ID
    product_id?: number | null;
    name: string;
    type: OptionType;
    is_required: boolean;
    is_global: boolean;
    position: number;
    values?: OptionValue[];
    is_open?: boolean; // UI state for accordion
}

export interface ProductVariant {
    id?: number;
    uid: string; // FleetCart-style unique identifier for this variant
    uids: string; // Combined variation value UIDs like "abc123.def456"
    product_id?: number;
    name: string;
    sku?: string;
    gtin?: string;
    price: number;
    special_price?: number | null; // FleetCart naming
    special_price_type?: 'fixed' | 'percent' | null;
    special_price_start?: string | null;
    special_price_end?: string | null;
    selling_price: number; // Computed final price
    qty: number;
    allow_backorder?: boolean;
    in_stock: boolean;
    is_active: boolean;
    is_default: boolean;
    position: number;
    // Computed attributes
    base_image?: MediaImage | null;
    has_special_price?: boolean;
    is_in_stock?: boolean;
    is_out_of_stock?: boolean;
    media?: MediaImage[];
}

export interface ProductUnit {
    type?: string | null;
    label?: string;
    suffix?: string;
    is_decimal_stock?: boolean;
    min?: number;
    max?: number | null;
    step?: number;
    quantity_prefix?: string | null;
    price_prefix?: string | null;
    stock_prefix?: string | null;
    default_qty?: number | null;
    info_top?: string | null;
    info_bottom?: string | null;
}

export interface ProductPayload {
    name: string;
    sku?: string;
    gtin?: string;
    slug?: string;
    meta_title?: string;
    meta_description?: string;
    google_product_category_id?: number | null;
    brand_id?: number | null;
    price: number;
    discount_price?: number | null;
    discount_start?: string | null;
    discount_end?: string | null;
    status: 'draft' | 'published';
    short_description?: string;
    description?: string;
    show_unit_pricing?: boolean;
    sale_unit_id?: number | null;
    unit_type?: 'global' | 'custom' | null;
    custom_unit?: ProductUnit;
    list_variants_separately?: boolean;
    qty?: number;
    allow_backorder?: boolean;
    in_stock?: boolean;
    is_active?: boolean;
    tags?: string[];
    categories?: number[];
    tax_class_id?: number | null;
    primary_category_id?: number | null;
    variations?: number[]; // variation IDs
    variants?: ProductVariant[];
    media_ids?: number[];
    options?: ProductOption[];

    // Product specification attributes (FleetCart-like)
    spec_attributes?: Array<{
        attribute_id: number;
        value_ids: number[];
    }>;
}
