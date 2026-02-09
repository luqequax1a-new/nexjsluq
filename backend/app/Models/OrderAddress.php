<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'type',
        'first_name',
        'last_name',
        'phone',
        'email',
        'company',
        'tax_number',
        'tax_office',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'postal_code',
        'country',
    ];

    protected $appends = ['full_name', 'full_address'];

    /**
     * Order relationship
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get full name
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /**
     * Get formatted full address
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address_line_1,
            $this->address_line_2,
            $this->state,
            $this->city,
            $this->postal_code,
        ]);
        return implode(', ', $parts);
    }

    /**
     * Create from customer address
     */
    public static function createFromCustomerAddress(int $orderId, string $type, CustomerAddress $address): self
    {
        return self::create([
            'order_id' => $orderId,
            'type' => $type,
            'first_name' => $address->first_name,
            'last_name' => $address->last_name,
            'phone' => $address->phone,
            'company' => $address->company,
            'address_line_1' => $address->address_line_1,
            'address_line_2' => $address->address_line_2,
            'city' => $address->city,
            'state' => $address->state,
            'postal_code' => $address->postal_code,
            'country' => $address->country,
        ]);
    }
}
