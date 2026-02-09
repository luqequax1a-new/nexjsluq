<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartOfferUsage extends Model
{
    use HasFactory;

    protected $table = 'cart_offer_usage';

    protected $fillable = [
        'cart_offer_id',
        'customer_id',
        'order_id',
        'session_id',
        'used_at',
    ];

    protected $casts = [
        'used_at' => 'datetime',
    ];

    // Relations
    public function cartOffer(): BelongsTo
    {
        return $this->belongsTo(CartOffer::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
