<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'logo',
        'is_active',
        'base_rate',
        'free_threshold',
        'cod_enabled',
        'cod_fee',
        'position',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'cod_enabled' => 'boolean',
        'base_rate' => 'decimal:2',
        'free_threshold' => 'decimal:2',
        'cod_fee' => 'decimal:2',
        'position' => 'integer',
    ];

    /**
     * Get the shipping cost for a given subtotal.
     * 
     * Note: Free shipping threshold is checked against the subtotal BEFORE discounts.
     * This is intentional to prevent coupon abuse where customers could get free shipping
     * by applying coupons that reduce the total below the threshold.
     * 
     * @param float $subtotal The cart subtotal before discounts
     * @return float The shipping cost
     */
    public function calculateCost($subtotal): float
    {
        if ($this->free_threshold !== null && $subtotal >= $this->free_threshold) {
            return 0;
        }

        return (float) $this->base_rate;
    }
}
