<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'label',
        'quantity_prefix',
        'min',
        'max',
        'step',
        'default_qty',
        'info_top',
        'info_bottom',
        'price_prefix',
        'stock_prefix',
        'is_decimal_stock',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'min' => 'decimal:3',
        'max' => 'decimal:3',
        'step' => 'decimal:3',
        'default_qty' => 'decimal:3',
        'is_decimal_stock' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
