<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartOffer;
use Illuminate\Support\Collection;

class CartOfferService
{
    public function resolveBestOffer(
        Cart $cart, 
        string $placement = 'checkout',
        ?int $customerId = null,
        ?int $productId = null
    ): ?array {
        $offers = CartOffer::active()
            ->forPlacement($placement)
            ->withinDateRange()
            ->orderByDesc('priority')
            ->orderByDesc('created_at')
            ->with(['products.product.media', 'products.product.saleUnit', 'products.product.productUnit', 'products.variant.media'])
            ->get();

        foreach ($offers as $offer) {
            if (!$this->matchesConditions($cart, $offer, $productId)) {
                continue;
            }

            $data = $this->buildOfferData($offer, $cart, $productId);
            if ($data !== null) {
                return $data;
            }
        }

        return null;
    }

    protected function matchesConditions(Cart $cart, CartOffer $offer, ?int $currentProductId = null): bool
    {
        $conditions = $offer->conditions ?? [];
        $cartSubTotal = (float) $cart->subtotal;

        // Minimum sepet tutarı
        if (isset($conditions['min_cart_total']) && $conditions['min_cart_total'] > 0) {
            if ($cartSubTotal < (float) $conditions['min_cart_total']) {
                return false;
            }
        }

        // Maksimum sepet tutarı
        if (isset($conditions['max_cart_total']) && $conditions['max_cart_total'] > 0) {
            if ($cartSubTotal > (float) $conditions['max_cart_total']) {
                return false;
            }
        }

        // Minimum ürün adedi
        if (isset($conditions['min_items_count']) && $conditions['min_items_count'] > 0) {
            if ($cart->items->sum('quantity') < (int) $conditions['min_items_count']) {
                return false;
            }
        }

        // Maksimum ürün adedi
        if (isset($conditions['max_items_count']) && $conditions['max_items_count'] > 0) {
            if ($cart->items->sum('quantity') > (int) $conditions['max_items_count']) {
                return false;
            }
        }

        // İndirimli ürün varsa gösterme
        if ($conditions['exclude_discounted'] ?? false) {
            $hasDiscounted = $cart->items->contains(function ($item) {
                return $item->product->selling_price < $item->product->price;
            });
            
            if ($hasDiscounted) {
                return false;
            }
        }

        // Teklif ürünü zaten sepetteyse gösterme
        if ($conditions['hide_if_in_cart'] ?? true) {
            $offerProductIds = $offer->products->pluck('product_id')->toArray();
            $cartProductIds = $cart->items->pluck('product_id')->toArray();
            
            if (!empty(array_intersect($offerProductIds, $cartProductIds))) {
                return false;
            }
        }

        // Müşteri koşulları
        if ($conditions['logged_in_only'] ?? false) {
            if (!$cart->customer_id) return false;
        }

        // Tetikleyici kontrolü
        return $this->matchesTrigger($cart, $offer, $currentProductId);
    }

    protected function matchesTrigger(Cart $cart, CartOffer $offer, ?int $currentProductId = null): bool
    {
        $config = $offer->trigger_config ?? [];

        return match($offer->trigger_type) {
            'all_products' => true,
            
            'specific_products' => (
                ($currentProductId && in_array($currentProductId, $config['product_ids'] ?? [])) ||
                $cart->items->contains(function ($item) use ($config) {
                    return in_array($item->product_id, $config['product_ids'] ?? []);
                })
            ),
            
            'specific_categories' => (
                ($currentProductId && \App\Models\Product::find($currentProductId)?->categories()
                    ->whereIn('categories.id', $config['category_ids'] ?? [])
                    ->exists()) ||
                $cart->items->contains(function ($item) use ($config) {
                    return $item->product->categories()
                        ->whereIn('categories.id', $config['category_ids'] ?? [])
                        ->exists();
                })
            ),
            
            'cart_total' => $this->inTotalRange($cart, $config),
            
            default => false
        };
    }

    protected function inTotalRange(Cart $cart, array $config): bool
    {
        $total = (float) $cart->subtotal;
        
        if (isset($config['min_total']) && $total < (float) $config['min_total']) {
            return false;
        }
        
        if (isset($config['max_total']) && $config['max_total'] > 0 && $total > (float) $config['max_total']) {
            return false;
        }
        
        return true;
    }

    protected function buildOfferData(CartOffer $offer, Cart $cart, ?int $currentProductId = null): ?array
    {
        $products = $offer->products
            // product_page placement'ta görüntülenen ürünün kendisini teklif olarak gösterme
            ->filter(function ($offerProduct) use ($currentProductId) {
                if ($currentProductId && $offerProduct->product_id === $currentProductId) {
                    return false;
                }
                return true;
            })
            ->filter(fn ($op) => $op->product !== null)
            ->map(function ($offerProduct) {
                $product = $offerProduct->product;
                $variant = $offerProduct->variant;
                $item = $variant ?? $product;
                
                // discount_base'e göre fiyat belirle
                $basePrice = ($offerProduct->discount_base ?? 'selling_price') === 'regular_price' 
                    ? (float) ($item->price ?? 0)
                    : (float) ($item->selling_price ?? $item->price ?? 0);

                $discountedPrice = $this->calculateDiscountedPrice(
                    $basePrice,
                    $offerProduct->discount_type ?? 'percentage',
                    (float) ($offerProduct->discount_value ?? 0)
                );

                // Unit verisini Product->unit accessor'ından al (tüm alanlar gelsin)
                $unitData = $product->unit ?? null;

                return [
                    'id' => $offerProduct->id,
                    'product_id' => $offerProduct->product_id,
                    'variant_id' => $offerProduct->variant_id,
                    'name' => $product->name . ($variant ? " ({$variant->name})" : ""),
                    'image' => $item->media->first()?->path ?? $product->media->first()?->path,
                    'sku' => $item->sku,
                    'base_price' => $basePrice,
                    'discounted_price' => $discountedPrice,
                    'discount_amount' => max(0, $basePrice - $discountedPrice),
                    'discount_type' => $offerProduct->discount_type,
                    'discount_value' => (float) $offerProduct->discount_value,
                    'discount_percentage' => $offerProduct->discount_type === 'percentage' 
                        ? (float) $offerProduct->discount_value 
                        : ($basePrice > 0 ? round((($basePrice - $discountedPrice) / $basePrice) * 100, 0) : 0),
                    'unit' => $unitData,
                    'allow_variant_selection' => $offerProduct->allow_variant_selection,
                    'variants' => $offerProduct->allow_variant_selection 
                        ? $this->formatVariants($product)
                        : null,
                    'show_condition' => $offerProduct->show_condition,
                ];
            })->values()->toArray();

        // Tüm ürünler filtrelendiyse null dön
        if (empty($products)) {
            return null;
        }

        return [
            'id' => $offer->id,
            'title' => $offer->getTitle(),
            'description' => $offer->description,
            'display_config' => $offer->display_config,
            'products' => $products,
        ];
    }

    protected function calculateDiscountedPrice(
        float $basePrice, 
        string $type, 
        float $value
    ): float {
        return match($type) {
            'percentage' => round(max($basePrice * (1 - $value / 100), 0), 2),
            'fixed' => round(max($basePrice - $value, 0), 2),
            default => $basePrice
        };
    }

    protected function formatVariants($product): array
    {
        return $product->variants->map(function ($variant) {
            return [
                'id' => $variant->id,
                'name' => $variant->name,
                'sku' => $variant->sku,
                'price' => (float) $variant->selling_price,
                'image' => $variant->media->first()?->path,
            ];
        })->toArray();
    }
}
