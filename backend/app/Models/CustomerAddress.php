<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'title',
        'first_name',
        'last_name',
        'type',
        'phone',
        'company',
        'tax_number',
        'tax_office',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'postal_code',
        'country',
        'is_default_billing',
        'is_default_shipping',
    ];

    protected $casts = [
        'is_default_billing' => 'boolean',
        'is_default_shipping' => 'boolean',
    ];

    protected $appends = ['full_name', 'full_address'];

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
            $this->country,
        ]);
        return implode(', ', $parts);
    }

    /**
     * Customer relationship
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Set as default billing and reset others
     */
    public function setAsDefaultBilling(): void
    {
        $this->customer->addresses()->update(['is_default_billing' => false]);
        $this->update(['is_default_billing' => true]);
    }

    /**
     * Set as default shipping and reset others
     */
    public function setAsDefaultShipping(): void
    {
        $this->customer->addresses()->update(['is_default_shipping' => false]);
        $this->update(['is_default_shipping' => true]);
    }
}
