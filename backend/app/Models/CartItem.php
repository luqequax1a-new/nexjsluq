<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Unit;

class CartItem extends Model
{
    protected $fillable = [
        'cart_id',
        'product_id',
        'product_variant_id',
        'sale_unit_id',
        'product_name',
        'product_sku',
        'quantity',
        'unit_price',
        'total_price',
        'tax_rate',
        'tax_amount',
        'discount_amount',
        'options',
        'variant_values',
        'cart_offer_id',
        'offer_data',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'options' => 'array',
        'variant_values' => 'array',
        'offer_data' => 'array',
    ];

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function saleUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'sale_unit_id');
    }

    public function cartOffer(): BelongsTo
    {
        return $this->belongsTo(CartOffer::class, 'cart_offer_id');
    }

    public function calculateTotals(): void
    {
        $this->total_price = $this->quantity * $this->unit_price;
        
        // Calculate tax
        $this->tax_amount = $this->total_price * ($this->tax_rate / 100);
        
        // Save and update cart totals
        $this->save();
        $this->cart->calculateTotals();
    }

    public function getUnitSuffix(): string
    {
        return $this->saleUnit?->name ?? '';
    }

    public function getDisplayName(): string
    {
        $name = $this->product_name;
        
        if ($this->variant) {
            $name .= ' - ' . $this->variant->name;
        }
        
        if ($this->options && count($this->options) > 0) {
            $optionText = collect($this->options)
                ->map(fn($value, $key) => "{$key}: {$value}")
                ->join(', ');
            $name .= " ({$optionText})";
        }
        
        return $name;
    }

    public function isInStock(): bool
    {
        $stockQuantity = (float) ($this->variant?->qty ?? $this->product->qty);
        $allowBackorder = (bool) ($this->variant?->allow_backorder ?? $this->product->allow_backorder);
        return $allowBackorder || (float) $this->quantity <= $stockQuantity;
    }

    public function canIncreaseQuantity(float $additionalQuantity): bool
    {
        $stockQuantity = (float) ($this->variant?->qty ?? $this->product->qty);
        $allowBackorder = (bool) ($this->variant?->allow_backorder ?? $this->product->allow_backorder);
        return $allowBackorder || ((float) $this->quantity + $additionalQuantity) <= $stockQuantity;
    }

    public function updateQuantity(float $quantity): void
    {
        $this->quantity = $quantity;
        $this->calculateTotals();
    }
}
