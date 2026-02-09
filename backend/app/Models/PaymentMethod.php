<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'enabled',
        'settings',
        'position',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'settings' => 'array',
        'position' => 'integer',
    ];

    /**
     * Get the fee amount for this payment method
     */
    public function getFeeAmount($totalAmount = 0)
    {
        $settings = $this->settings ?? [];
        $operation = $settings['fee_operation'] ?? 'add';
        $multiplier = $operation === 'discount' ? -1 : 1;
        
        if (($settings['fee_type'] ?? null) === 'percentage') {
            return $multiplier * ($totalAmount * ($settings['fee_percentage'] ?? 0) / 100);
        }
        
        return $multiplier * ($settings['fee_amount'] ?? 0);
    }

    /**
     * Check if the payment method is available for the given amount
     */
    public function isAvailableForAmount($amount)
    {
        $settings = $this->settings ?? [];
        
        $minAmount = $settings['min_amount'] ?? 0;
        $maxAmount = $settings['max_amount'] ?? 0;
        
        if ($minAmount > 0 && $amount < $minAmount) {
            return false;
        }
        
        if ($maxAmount > 0 && $amount > $maxAmount) {
            return false;
        }
        
        return $this->enabled;
    }

    /**
     * Get formatted fee text
     */
    public function getFeeTextAttribute()
    {
        $settings = $this->settings ?? [];
        $operation = $settings['fee_operation'] ?? 'add';
        $sign = $operation === 'discount' ? '-' : '+';
        
        if (($settings['fee_type'] ?? null) === 'percentage' && ($settings['fee_percentage'] ?? 0) > 0) {
            return $sign . '%' . number_format($settings['fee_percentage'], 2);
        }
        
        if (($settings['fee_type'] ?? null) === 'fixed' && ($settings['fee_amount'] ?? 0) > 0) {
            return $sign . '₺' . number_format($settings['fee_amount'], 2);
        }
        
        return 'Ücretsiz';
    }

    /**
     * Scope to get only enabled payment methods
     */
    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    /**
     * Scope to order by position
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('position')->orderBy('name');
    }
}
