<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Setting;

class SettingsController extends Controller
{
    public function index()
    {
        $keys = [
            'store_name',
            'store_meta_title',
            'store_meta_description',
            'store_email',
            'store_phone',
            'store_address',
            'store_country',
            'store_city',
            'store_district',
            'store_postcode',
            'logo',
            'favicon',
            'default_locale',
            'default_currency',
            'timezone',
            'storefront_primary_menu',
            'storefront_categories_menu',
            'storefront_desktop_categories_alignment',
            'announcement_enabled',
            'announcement_text',
            'announcement_bg_color',
            'announcement_text_color',
            'announcement_font_size',
            'announcement_font_family',
            'announcement_speed',
            'announcement_marquee',
            'announcement_sticky',
            'whatsapp_phone',
            'whatsapp_product_enabled',
            'whatsapp_product_button_text',
            'whatsapp_product_message_template',
            'whatsapp_cart_enabled',
            'whatsapp_cart_button_text',
            'whatsapp_cart_message_template',
            // Product detail settings
            'storefront_show_stock_quantity',
            // Related products settings
            'related_products_enabled',
            'related_products_count',
            'related_products_source',
            'related_products_category_id',
            'related_products_product_ids',
        ];

        $settings = Setting::query()
            ->whereIn('key', $keys)
            ->get()
            ->pluck('value', 'key');

        return response()->json($settings);
    }
}
