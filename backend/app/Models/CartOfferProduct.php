<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartOfferProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'cart_offer_id',
        'product_id',
        'variant_id',
        'allow_variant_selection',
        'discount_type',
        'discount_base',
        'discount_value',
        'display_order',
        'show_condition',
    ];

    protected $casts = [
        'allow_variant_selection' => 'boolean',
        'discount_value' => 'decimal:2',
        'display_order' => 'integer',
    ];

    // Relations
    public function cartOffer(): BelongsTo
    {
        return $this->belongsTo(CartOffer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    // Methods
    public function getItem()
    {
        return $this->variant ?? $this->product;
    }

    public function calculateDiscountedPrice(float $originalPrice): float
    {
        return match($this->discount_type) {
            'percentage' => max($originalPrice * (1 - $this->discount_value / 100), 0),
            'fixed' => max($originalPrice - $this->discount_value, 0),
            default => $originalPrice
        };
    }
}
