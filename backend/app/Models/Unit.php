<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'label',
        'quantity_prefix',
        'short_name',
        'suffix',
        'min',
        'max',
        'step',
        'default_qty',
        'info_top',
        'info_bottom',
        'price_prefix',
        'stock_prefix',
        'is_decimal_stock',
        'is_active',
    ];

    protected $casts = [
        'min' => 'decimal:3',
        'max' => 'decimal:3',
        'step' => 'decimal:3',
        'default_qty' => 'decimal:3',
        'is_decimal_stock' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Ondalık stok izni var mı?
     */
    public function isDecimalStock(): bool
    {
        return (bool) $this->is_decimal_stock;
    }

    /**
     * Miktarı normalize et (min, step, decimal kontrolü)
     */
    public function normalizeQuantity(float $qty): float
    {
        $min = (float) ($this->min ?? 0);
        $step = (float) ($this->step ?? 0);

        // Min kontrolü
        if ($qty < $min) {
            $qty = $min;
        }

        // Step kontrolü
        if ($step > 0) {
            $steps = round(($qty - $min) / $step);
            $qty = $min + $steps * $step;
        }

        // Ondalık kontrolü
        return $this->isDecimalStock() ? round($qty, 2) : round($qty);
    }

    /**
     * Miktar geçerli mi?
     */
    public function isValidQuantity(float $qty): bool
    {
        $min = (float) ($this->min ?? 0);

        // Min kontrolü
        if ($qty < $min) {
            return false;
        }

        // Max kontrolü
        if ($this->max && $qty > $this->max) {
            return false;
        }

        // Ondalık kontrolü
        if (!$this->isDecimalStock() && floor($qty) != $qty) {
            return false;
        }

        return true;
    }

    /**
     * Görünen suffix (stok için)
     */
    public function getDisplaySuffix(): string
    {
        return $this->stock_prefix ?: $this->suffix ?: '';
    }
}
