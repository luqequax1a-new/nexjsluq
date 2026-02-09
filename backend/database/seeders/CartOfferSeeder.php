<?php

namespace Database\Seeders;

use App\Models\CartOffer;
use App\Models\CartOfferProduct;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CartOfferSeeder extends Seeder
{
    public function run(): void
    {
        CartOfferProduct::query()->delete();
        CartOffer::query()->delete();

        // İlk published ürünü bul (kampanya teklifi olarak sunulacak)
        $offerProduct1 = Product::where('status', 'published')->where('selling_price', '>', 0)->first();
        $offerProduct2 = Product::where('status', 'published')->where('selling_price', '>', 0)->skip(1)->first();

        if (!$offerProduct1) {
            return;
        }

        $offer = CartOffer::create([
            'name' => 'Sepet Kampanyası',
            'title' => 'Size Özel Teklif!',
            'description' => 'Sepetinize özel indirimli ürün fırsatı. Bu teklif sınırlı sürelidir!',
            'placement' => 'checkout',
            'trigger_type' => 'all_products',
            'trigger_config' => null,
            'conditions' => [
                'min_cart_total' => 100,
                'max_cart_total' => null,
                'exclude_discounted' => false,
                'hide_if_in_cart' => true,
            ],
            'used_count' => 0,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonths(3),
            'display_config' => [
                'countdown_enabled' => true,
                'countdown_minutes' => 5,
                'badge_color' => '#ef4444',
                'badge_text' => 'FIRSAT',
                'accept_button_text' => 'Sepete Ekle',
                'reject_button_text' => 'Hayır, Teşekkürler',
            ],
            'priority' => 10,
            'is_active' => true,
        ]);

        // İlk teklif ürünü — %30 indirim
        CartOfferProduct::create([
            'cart_offer_id' => $offer->id,
            'product_id' => $offerProduct1->id,
            'variant_id' => null,
            'allow_variant_selection' => $offerProduct1->variants()->exists(),
            'discount_type' => 'percentage',
            'discount_base' => 'selling_price',
            'discount_value' => 30.00,
            'display_order' => 0,
            'show_condition' => 'always',
        ]);

        // İkinci teklif ürünü — %20 indirim (reddedilirse göster)
        if ($offerProduct2) {
            CartOfferProduct::create([
                'cart_offer_id' => $offer->id,
                'product_id' => $offerProduct2->id,
                'variant_id' => null,
                'allow_variant_selection' => $offerProduct2->variants()->exists(),
                'discount_type' => 'percentage',
                'discount_base' => 'selling_price',
                'discount_value' => 20.00,
                'display_order' => 1,
                'show_condition' => 'if_rejected',
            ]);
        }
    }
}
