// ========== CUSTOMER TYPES ==========

export interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone: string | null;
    national_id: string | null;
    group: 'normal' | 'vip' | 'wholesale';
    total_spent: number;
    total_orders: number;
    last_order_at: string | null;
    notes: string | null;
    is_active: boolean;
    accepts_marketing: boolean;
    created_at: string;
    updated_at: string;
    addresses?: CustomerAddress[];
    orders_count?: number;
}

export interface CustomerAddress {
    id: number;
    customer_id: number;
    title: string | null;
    first_name: string;
    last_name: string;
    full_name: string;
    type: 'individual' | 'corporate';
    phone: string | null;
    company: string | null;
    tax_number: string | null;
    tax_office: string | null;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string | null;
    postal_code: string | null;
    country: string;
    full_address: string;
    is_default_billing: boolean;
    is_default_shipping: boolean;
    created_at: string;
}

export interface CustomerFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    national_id?: string;
    group?: 'normal' | 'vip' | 'wholesale';
    notes?: string;
    address?: Partial<CustomerAddress>;
}

// ========== ORDER TYPES ==========

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';

export type PaymentStatus =
    | 'pending'
    | 'paid'
    | 'failed'
    | 'refunded'
    | 'partial_refund';

export interface Order {
    id: number;
    order_number: string;
    customer_id: number | null;
    user_id: number | null;
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: string | null;
    payment_reference: string | null;
    subtotal: number;
    tax_total: number;
    shipping_total: number;
    payment_fee?: number;
    discount_total: number;
    grand_total: number;
    currency_code: string;
    currency_rate: number;
    coupon_code: string | null;
    coupon_discount: number;
    shipping_method: string | null;
    shipping_tracking_number: string | null;
    shipping_carrier: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    customer_note: string | null;
    admin_note: string | null;
    invoice_number: string | null;
    invoiced_at: string | null;
    source: string;
    created_at: string;
    updated_at: string;
    // Relations
    customer?: Customer;
    user?: { id: number; name: string };
    items?: OrderItem[];
    billing_address?: OrderAddress;
    shipping_address?: OrderAddress;
    histories?: OrderHistory[];
    items_count?: number;
    // Computed
    status_label?: string;
    payment_status_label?: string;
    customer_order_number?: number | null;
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number | null;
    product_variant_id: number | null;
    name: string;
    sku: string | null;
    options: Record<string, string> | null;
    image: string | null;
    unit_price: number;
    quantity: number;
    unit_label: string;
    tax_rate: number;
    tax_amount: number;
    discount_amount: number;
    line_total: number;
    refunded_quantity: number;
    refunded_amount: number;
    // Relations
    product?: {
        id: number;
        name: string;
        unit?: {
            quantity_prefix?: string | null;
            stock_prefix?: string | null;
            suffix?: string | null;
            price_prefix?: string | null;
        } | null;
    };
    variant?: {
        id: number;
        name: string;
        base_image?: {
            path?: string | null;
            url?: string | null;
        } | null;
        media?: Array<{
            path?: string | null;
            url?: string | null;
        }> | null;
    };
}

export interface OrderAddress {
    id: number;
    order_id: number;
    type: 'billing' | 'shipping';
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    company: string | null;
    tax_number: string | null;
    tax_office: string | null;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string | null;
    postal_code: string | null;
    country: string;
    full_address: string;
}

export interface OrderHistory {
    id: number;
    order_id: number;
    user_id: number | null;
    status: OrderStatus | null;
    payment_status: PaymentStatus | null;
    action: string;
    note: string | null;
    meta: Record<string, unknown> | null;
    is_customer_notified: boolean;
    created_at: string;
    // Relations
    user?: { id: number; name: string };
    // Computed
    action_label?: string;
    action_icon?: string;
}

export interface OrderFormData {
    customer_id?: number;
    items: {
        product_id: number;
        variant_id?: number;
        quantity: number;
        unit_price?: number;
    }[];
    billing_address: Partial<OrderAddress>;
    shipping_address?: Partial<OrderAddress>;
    same_as_billing?: boolean;
    payment_method?: string;
    shipping_method?: string;
    shipping_total?: number;
    discount_total?: number;
    coupon_code?: string;
    customer_note?: string;
    admin_note?: string;
    status?: OrderStatus;
    payment_status?: PaymentStatus;
}

export interface OrderUpdateData {
    status?: OrderStatus;
    payment_status?: PaymentStatus;
    payment_method?: string;
    shipping_tracking_number?: string;
    shipping_carrier?: string;
    admin_note?: string;
    shipping_total?: number;
    discount_total?: number;
}

export interface OrderStatistics {
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    processing_orders: number;
    shipped_orders: number;
    cancelled_orders: number;
    average_order_value: number;
    status_breakdown: Record<OrderStatus, number>;
    payment_status_breakdown: Record<PaymentStatus, number>;
}

export interface OrderOptions {
    statuses: Record<OrderStatus, string>;
    status_colors: Record<OrderStatus, string>;
    payment_statuses: Record<PaymentStatus, string>;
    payment_status_colors: Record<PaymentStatus, string>;
}

// ========== API RESPONSE TYPES ==========

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

// ========== SHIPPING TYPES ==========

export interface ShippingMethod {
    id: number;
    code: string;
    name: string;
    logo: string | null;
    is_active: boolean;
    base_rate: number;
    free_threshold: number | null;
    cod_enabled: boolean;
    cod_fee: number;
    position: number;
    created_at: string;
    updated_at: string;
}
