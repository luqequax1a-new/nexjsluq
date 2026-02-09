<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CustomerGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'discount_percentage',
        'auto_assignment_rules',
        'is_active',
        'customer_count',
    ];

    protected $casts = [
        'discount_percentage' => 'float',
        'auto_assignment_rules' => 'array',
        'is_active' => 'boolean',
        'customer_count' => 'integer',
    ];

    /**
     * Customers in this group
     */
    public function customers(): BelongsToMany
    {
        return $this->belongsToMany(Customer::class, 'customer_customer_group')
            ->withTimestamps()
            ->withPivot('assigned_at');
    }

    /**
     * Coupons that target this group
     */
    public function coupons(): BelongsToMany
    {
        return $this->belongsToMany(Coupon::class, 'coupon_customer_groups')
            ->withTimestamps();
    }

    /**
     * Auto-assign a customer based on rules
     */
    public function shouldAutoAssign(Customer $customer): bool
    {
        if (!$this->is_active || !$this->auto_assignment_rules) {
            return false;
        }

        $rules = $this->auto_assignment_rules;

        // Check total spent rule
        if (isset($rules['min_total_spent']) && $customer->total_spent < $rules['min_total_spent']) {
            return false;
        }

        if (isset($rules['max_total_spent']) && $customer->total_spent > $rules['max_total_spent']) {
            return false;
        }

        // Check total orders rule
        if (isset($rules['min_total_orders']) && $customer->total_orders < $rules['min_total_orders']) {
            return false;
        }

        if (isset($rules['max_total_orders']) && $customer->total_orders > $rules['max_total_orders']) {
            return false;
        }

        // Check registration date
        if (isset($rules['registered_after']) && $customer->created_at < $rules['registered_after']) {
            return false;
        }

        if (isset($rules['registered_before']) && $customer->created_at > $rules['registered_before']) {
            return false;
        }

        return true;
    }

    /**
     * Assign a customer to this group
     */
    public function assignCustomer(Customer $customer): void
    {
        if (!$this->customers()->where('customer_id', $customer->id)->exists()) {
            $this->customers()->attach($customer->id, ['assigned_at' => now()]);
            $this->increment('customer_count');
        }
    }

    /**
     * Remove a customer from this group
     */
    public function removeCustomer(Customer $customer): void
    {
        if ($this->customers()->where('customer_id', $customer->id)->exists()) {
            $this->customers()->detach($customer->id);
            $this->decrement('customer_count');
        }
    }

    /**
     * Update customer count
     */
    public function updateCustomerCount(): void
    {
        $this->update([
            'customer_count' => $this->customers()->count(),
        ]);
    }

    /**
     * Run auto-assignment for all customers
     */
    public function runAutoAssignment(): int
    {
        if (!$this->is_active || !$this->auto_assignment_rules) {
            return 0;
        }

        $assigned = 0;
        $customers = Customer::where('is_active', true)->get();

        foreach ($customers as $customer) {
            if ($this->shouldAutoAssign($customer)) {
                $this->assignCustomer($customer);
                $assigned++;
            }
        }

        return $assigned;
    }
}
