<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\CustomerResetPassword;

class Customer extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'national_id',
        'group',
        'total_spent',
        'total_orders',
        'last_order_at',
        'notes',
        'is_active',
        'accepts_marketing',
        'password',
        'email_verified_at',
    ];

    protected $casts = [
        'total_spent' => 'decimal:2',
        'total_orders' => 'integer',
        'last_order_at' => 'datetime',
        'is_active' => 'boolean',
        'accepts_marketing' => 'boolean',
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['full_name'];

    /**
     * Get full name accessor
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /**
     * Customer addresses
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    /**
     * Customer orders
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Customer groups
     */
    public function groups(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(CustomerGroup::class, 'customer_customer_group')
            ->withTimestamps()
            ->withPivot('assigned_at');
    }

    /**
     * Get default billing address
     */
    public function defaultBillingAddress()
    {
        return $this->addresses()->where('is_default_billing', true)->first();
    }

    /**
     * Get default shipping address
     */
    public function defaultShippingAddress()
    {
        return $this->addresses()->where('is_default_shipping', true)->first();
    }

    /**
     * Update customer stats after order
     */
    public function updateStats(): void
    {
        $this->update([
            'total_orders' => $this->orders()->whereNotIn('status', ['cancelled', 'refunded'])->count(),
            'total_spent' => $this->orders()->whereIn('payment_status', ['paid'])->sum('grand_total'),
            'last_order_at' => $this->orders()->latest()->value('created_at'),
        ]);
    }

    /**
     * Group labels
     */
    public static function groupLabels(): array
    {
        return [
            'normal' => 'Normal',
            'vip' => 'VIP',
            'wholesale' => 'Toptancı',
        ];
    }

    /**
     * Send the password reset notification.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new CustomerResetPassword($token));
    }
}
