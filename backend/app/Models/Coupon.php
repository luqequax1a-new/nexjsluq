<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Coupon extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'type', // fixed, percentage, free_shipping
        'value',
        'min_spend', // LEGACY: keep for backward compat or migrate logic to min_requirement
        
        // Advanced
        'applies_to', // all, specific_products, specific_categories
        'min_requirement_type', // none, amount, quantity
        'min_requirement_value',
        'customer_eligibility', // all, specific_groups, specific_customers
        'is_automatic',

        // BXGY fields
        'discount_type', // simple, bxgy, tiered
        'buy_quantity',
        'get_quantity',
        'get_discount_percentage',
        'buy_product_ids',
        'get_product_ids',

        // Combination and priority
        'can_combine_with_other_coupons',
        'can_combine_with_auto_discounts',
        'priority',

        // Exclude fields
        'exclude_product_ids',
        'exclude_category_ids',

        'tiered_data',

        'usage_limit',
        'usage_limit_per_customer',
        'used_count',
        'start_date',
        'end_date',
        'is_active',
        'description',
    ];

    protected $casts = [
        'value' => 'float',
        'min_spend' => 'float',
        'min_requirement_value' => 'float',
        'usage_limit' => 'integer',
        'usage_limit_per_customer' => 'integer',
        'used_count' => 'integer',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
        'is_automatic' => 'boolean',
        'buy_quantity' => 'integer',
        'get_quantity' => 'integer',
        'get_discount_percentage' => 'float',
        'buy_product_ids' => 'array',
        'get_product_ids' => 'array',
        'exclude_product_ids' => 'array',
        'exclude_category_ids' => 'array',
        'tiered_data' => 'array',
        'can_combine_with_other_coupons' => 'boolean',
        'can_combine_with_auto_discounts' => 'boolean',
        'priority' => 'integer',
    ];

    // Relations
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'coupon_products')->withPivot('exclude');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'coupon_categories')->withPivot('exclude');
    }

    public function customers(): BelongsToMany
    {
        return $this->belongsToMany(Customer::class, 'coupon_customers');
    }

    public function customerGroups(): BelongsToMany
    {
        return $this->belongsToMany(CustomerGroup::class, 'coupon_customer_groups')
            ->withTimestamps();
    }

    /**
     * Check if coupon is valid
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = now();
        if ($this->start_date && $now->lt($this->start_date)) {
            return false;
        }

        if ($this->end_date && $now->gt($this->end_date)) {
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    /**
     * Check if can be used by customer
     */
    public function canBeUsedByCustomer(int $customerId): bool
    {
        // 1. Check Usage Limit Per Customer
        if ($this->usage_limit_per_customer !== null) {
            $used = Order::where('customer_id', $customerId)
                ->where('coupon_code', $this->code)
                ->whereNotIn('status', ['cancelled'])
                ->count();
            
            if ($used >= $this->usage_limit_per_customer) {
                return false;
            }
        }

        // 2. Check Customer Eligibility
        if ($this->customer_eligibility === 'specific_customers') {
            return $this->customers()->where('customers.id', $customerId)->exists();
        }

        // 3. Check Customer Groups
        if ($this->customer_eligibility === 'specific_groups') {
            $customer = Customer::with('groups')->find($customerId);
            if (!$customer) {
                return false;
            }
            
            $customerGroupIds = $customer->groups->pluck('id')->toArray();
            $couponGroupIds = $this->customerGroups()->pluck('customer_groups.id')->toArray();
            
            // Customer must be in at least one of the coupon's target groups
            return !empty(array_intersect($customerGroupIds, $couponGroupIds));
        }

        return true;
    }

    /**
     * Calculate discount amount for a given order context
     * Context: items (array of product/variant info with total), subtotal
     */
    public function calculateDiscount(float $subtotal, array $items = []): float
    {
        // Handle different discount types
        if ($this->discount_type === 'bxgy') {
            return $this->calculateBXGYDiscount($items);
        }

        if ($this->discount_type === 'tiered') {
            return $this->calculateTieredDiscount($subtotal, $items);
        }

        // 1. Check Minimum Requirements
        if ($this->min_requirement_type === 'amount' && $subtotal < $this->min_requirement_value) {
            return 0;
        }
        
        // Use min_spend if min_requirement is not set (legacy support)
        if ($this->min_requirement_type === 'none' && $this->min_spend > 0 && $subtotal < $this->min_spend) {
            return 0;
        }

        if ($this->min_requirement_type === 'quantity') {
            $totalQty = array_reduce($items, fn($sum, $item) => $sum + ($item['quantity'] ?? 0), 0);
            if ($totalQty < $this->min_requirement_value) {
                return 0;
            }
        }

        // 2. Calculate Discount Value
        if ($this->type === 'free_shipping') {
            // Logic handled by caller (shipping cost = 0)
            return 0; 
        }

        // Filter eligible items if "Specific Products" or "Specific Categories"
        $eligibleAmount = $subtotal;
        
        if ($this->applies_to === 'specific_products' && !empty($items)) {
            $eligibleAmount = $this->calculateEligibleAmountForProducts($items);
        } 
        elseif ($this->applies_to === 'specific_categories' && !empty($items)) {
            $eligibleAmount = $this->calculateEligibleAmountForCategories($items);
        }

        if ($this->type === 'percentage') {
            return ($eligibleAmount * $this->value) / 100;
        }

        return min($this->value, $eligibleAmount);
    }

    /**
     * Calculate eligible amount for specific products with exclude logic
     */
    protected function calculateEligibleAmountForProducts(array $items): float
    {
        $includedIds = $this->products()->wherePivot('exclude', false)->pluck('products.id')->toArray();
        $excludedIds = $this->exclude_product_ids ?? [];
        
        $eligibleAmount = 0;
        foreach ($items as $item) {
            $productId = $item['product_id'];
            
            // Check if product is included and not excluded
            if (in_array($productId, $includedIds) && !in_array($productId, $excludedIds)) {
                $eligibleAmount += ($item['unit_price'] * $item['quantity']);
            }
        }
        
        return $eligibleAmount;
    }

    /**
     * Calculate eligible amount for specific categories with exclude logic
     */
    protected function calculateEligibleAmountForCategories(array $items): float
    {
        $includedCategoryIds = $this->categories()->wherePivot('exclude', false)->pluck('categories.id')->toArray();
        $excludedCategoryIds = $this->exclude_category_ids ?? [];
        
        $eligibleAmount = 0;
        foreach ($items as $item) {
            // Fetch product with categories
            $product = Product::with('categories')->find($item['product_id']);
            
            if (!$product) {
                continue;
            }
            
            $productCategoryIds = $product->categories->pluck('id')->toArray();
            
            // Check if product belongs to included categories and not excluded ones
            $hasIncludedCategory = !empty(array_intersect($productCategoryIds, $includedCategoryIds));
            $hasExcludedCategory = !empty(array_intersect($productCategoryIds, $excludedCategoryIds));
            
            if ($hasIncludedCategory && !$hasExcludedCategory) {
                $eligibleAmount += ($item['unit_price'] * $item['quantity']);
            }
        }
        
        return $eligibleAmount;
    }

    /**
     * Calculate Tiered Discount
     */
    protected function calculateTieredDiscount(float $subtotal, array $items): float
    {
        if (empty($this->tiered_data)) {
            return 0;
        }

        // Sort tiers by min_requirement descending to find the highest applicable tier
        $tiers = collect($this->tiered_data)->sortByDesc('min')->values();
        
        $applicableTier = $tiers->first(function ($tier) use ($subtotal) {
            return $subtotal >= (float)$tier['min'];
        });

        if (!$applicableTier) {
            return 0;
        }

        $discountValue = (float)$applicableTier['value'];
        $discountType = $applicableTier['type']; // percentage or fixed

        // Filter eligible amount if specific target
        $eligibleAmount = $subtotal;
        if ($this->applies_to === 'specific_products' && !empty($items)) {
            $eligibleAmount = $this->calculateEligibleAmountForProducts($items);
        } elseif ($this->applies_to === 'specific_categories' && !empty($items)) {
            $eligibleAmount = $this->calculateEligibleAmountForCategories($items);
        }

        if ($discountType === 'percentage') {
            return ($eligibleAmount * $discountValue) / 100;
        }

        return min($discountValue, $eligibleAmount);
    }

    /**
     * Calculate BXGY (Buy X Get Y) discount
     */
    protected function calculateBXGYDiscount(array $items): float
    {
        if (!$this->buy_quantity || !$this->get_quantity) {
            return 0;
        }

        $buyProductIds = $this->buy_product_ids ?? [];
        $getProductIds = $this->get_product_ids ?? [];
        
        // If no specific products, apply to all
        if (empty($buyProductIds)) {
            $buyProductIds = array_column($items, 'product_id');
        }
        if (empty($getProductIds)) {
            $getProductIds = array_column($items, 'product_id');
        }

        // Count qualifying "buy" items
        $buyCount = 0;
        foreach ($items as $item) {
            if (in_array($item['product_id'], $buyProductIds)) {
                $buyCount += $item['quantity'];
            }
        }

        // Calculate how many "get" items qualify
        $qualifyingSets = floor($buyCount / $this->buy_quantity);
        $freeItemsAllowed = $qualifyingSets * $this->get_quantity;

        if ($freeItemsAllowed <= 0) {
            return 0;
        }

        // Apply discount to "get" items
        $discount = 0;
        $freeItemsApplied = 0;

        foreach ($items as $item) {
            if ($freeItemsApplied >= $freeItemsAllowed) {
                break;
            }

            if (in_array($item['product_id'], $getProductIds)) {
                $itemsToDiscount = min($item['quantity'], $freeItemsAllowed - $freeItemsApplied);
                $discountPercentage = $this->get_discount_percentage ?? 100;
                
                $discount += ($item['unit_price'] * $itemsToDiscount * $discountPercentage) / 100;
                $freeItemsApplied += $itemsToDiscount;
            }
        }

        return $discount;
    }

    /**
     * Get all applicable coupons for a given context (static method)
     */
    public static function getApplicableCoupons(array $items, float $subtotal, ?int $customerId = null): \Illuminate\Support\Collection
    {
        $query = self::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('start_date')
                  ->orWhere('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')
                  ->orWhere('end_date', '>=', now());
            })
            ->where(function ($q) {
                $q->whereNull('usage_limit')
                  ->orWhereRaw('used_count < usage_limit');
            });

        // Get automatic discounts
        $coupons = $query->where('is_automatic', true)
            ->orderBy('priority', 'desc')
            ->get();

        // Filter by customer eligibility
        if ($customerId) {
            $coupons = $coupons->filter(function ($coupon) use ($customerId) {
                return $coupon->canBeUsedByCustomer($customerId);
            });
        }

        // Filter by minimum requirements and calculate discounts
        $applicableCoupons = $coupons->filter(function ($coupon) use ($items, $subtotal) {
            $discount = $coupon->calculateDiscount($subtotal, $items);
            $coupon->calculated_discount = $discount;
            return $discount > 0;
        });

        return $applicableCoupons;
    }
}
