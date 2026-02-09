<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class CartOffer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'title',
        'description',
        'placement',
        'trigger_type',
        'trigger_config',
        'conditions',
        'used_count',
        'starts_at',
        'ends_at',
        'display_config',
        'priority',
        'is_active',
    ];

    protected $casts = [
        'trigger_config' => 'array',
        'conditions' => 'array',
        'display_config' => 'array',
        'used_count' => 'integer',
        'priority' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Relations
    public function products(): HasMany
    {
        return $this->hasMany(CartOfferProduct::class)->orderBy('display_order');
    }

    public function usage(): HasMany
    {
        return $this->hasMany(CartOfferUsage::class);
    }

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeForPlacement(Builder $query, string $placement): Builder
    {
        return $query->where('placement', $placement);
    }

    public function scopeWithinDateRange(Builder $query): Builder
    {
        $now = now();
        return $query->where(function ($q) use ($now) {
            $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
        })->where(function ($q) use ($now) {
            $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
        });
    }

    // Methods
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->starts_at && $this->starts_at->isFuture()) {
            return false;
        }
        
        if ($this->ends_at && $this->ends_at->isPast()) {
            return false;
        }

        return true;
    }

    public function canBeUsedByCustomer(?int $customerId): bool
    {
        return true; // Limits removed
    }

    public function incrementUsage(?int $customerId = null, ?int $orderId = null): void
    {
        $this->increment('used_count');

        $sessionId = null;
        try {
            if (session()->isStarted()) {
                $sessionId = session()->getId();
            }
        } catch (\Throwable $e) {
            // Stateless API — session unavailable
        }

        $this->usage()->create([
            'customer_id' => $customerId,
            'order_id' => $orderId,
            'session_id' => $sessionId,
            'used_at' => now(),
        ]);
    }

    public function getTitle(): string
    {
        return $this->title ?? $this->name;
    }
}
