<?php

namespace App\Models;

use App\Mail\BackInStockMail;
use App\Models\StockNotifyRequest;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uid',
        'uids',
        'product_id',
        'name',
        'sku',
        'gtin',
        'price',
        'special_price',
        'special_price_type',
        'special_price_start',
        'special_price_end',
        'selling_price',
        'qty',
        'allow_backorder',
        'in_stock',
        'is_active',
        'is_default',
        'position',
        'values',
    ];

    protected $casts = [
        'price' => 'float',
        'special_price' => 'float',
        'selling_price' => 'float',
        'special_price_start' => 'datetime',
        'special_price_end' => 'datetime',
        'allow_backorder' => 'boolean',
        'in_stock' => 'boolean',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'qty' => 'decimal:3',
        'values' => 'array',
    ];

    protected $appends = [
        'base_image',
        'base_image_thumb',
        'has_special_price',
        'is_in_stock',
        'is_out_of_stock',
    ];

    protected static function booted(): void
    {
        static::creating(function (ProductVariant $variant): void {
            if (empty($variant->uid)) {
                $variant->uid = Str::lower(Str::random(12));
            }
        });

        static::saving(function (ProductVariant $variant): void {
            // Compute selling_price like FleetCart
            if ($variant->hasSpecialPrice()) {
                $variant->selling_price = $variant->getSpecialPrice();
            } else {
                $variant->selling_price = $variant->price;
            }

            // Round qty for non-decimal stock products
            if ($variant->product) {
                $u = $variant->product->unit;
                if (isset($u['is_decimal_stock']) && !$u['is_decimal_stock'] && $variant->qty !== null) {
                    $variant->qty = round($variant->qty);
                }
            }
        });

        static::saved(function (ProductVariant $variant): void {
            // Keep parent stock flags synchronized with active variants.
            try {
                $product = $variant->product()->withoutGlobalScope('active')->first();
                if ($product) {
                    $activeVariantsQuery = $product->variants()
                        ->withoutGlobalScope('active')
                        ->where('is_active', true);

                    $sumQty = (float) (clone $activeVariantsQuery)->sum('qty');
                    $hasBackorder = (clone $activeVariantsQuery)->where('allow_backorder', true)->exists();

                    $product->withoutEvents(fn() => $product->update([
                        'qty' => $sumQty,
                        'allow_backorder' => $hasBackorder,
                        'in_stock' => $sumQty > 0 || $hasBackorder,
                    ]));
                }
            } catch (\Throwable $e) {
                // Silent fail
            }

            // Send back-in-stock notifications for this variant
            try {
                $wasOutOfStock = $variant->wasChanged('in_stock') && $variant->in_stock;
                $qtyIncreased = $variant->wasChanged('qty')
                    && (float) $variant->qty > 0
                    && (float) ($variant->getOriginal('qty') ?? 0) <= 0;

                if ($wasOutOfStock || $qtyIncreased) {
                    $product = $variant->product()->withoutGlobalScope('active')->first();
                    if (!$product) return;

                    $pending = StockNotifyRequest::query()
                        ->whereNull('sent_at')
                        ->where(function ($q) use ($variant, $product) {
                            $q->where('variant_id', $variant->id)
                              ->orWhere(function ($q) use ($product) {
                                  $q->where('product_id', $product->id)->whereNull('variant_id');
                              });
                        })
                        ->get();

                    foreach ($pending->groupBy('email') as $email => $requests) {
                        try {
                            Mail::to($email)->send(new BackInStockMail($product, $variant));
                            StockNotifyRequest::whereIn('id', $requests->pluck('id')->all())
                                ->update(['sent_at' => now()]);
                        } catch (\Throwable $e) {
                            Log::error('[STOCK_NOTIFY] variant mail failed', [
                                'variant_id' => $variant->id,
                                'email' => $email,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                }
            } catch (\Throwable $e) {
                Log::error('[STOCK_NOTIFY] variant observer error', ['error' => $e->getMessage()]);
            }
        });
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(Media::class, 'product_variant_id')
            ->where('scope', 'variant')
            ->orderBy('position');
    }

    /**
     * FleetCart-style: Get variation labels from uids.
     */
    public function getVariationLabels(): array
    {
        if (empty($this->uids)) {
            return [];
        }

        $tokens = array_values(array_filter(array_map(
            static fn($part) => trim((string) $part),
            explode('.', (string) $this->uids)
        ), static fn($part) => $part !== ''));

        if (empty($tokens)) {
            return [];
        }

        $numericIds = [];
        $uidTokens = [];
        foreach ($tokens as $token) {
            if (ctype_digit($token)) {
                $numericIds[] = (int) $token;
            } else {
                $uidTokens[] = $token;
            }
        }

        $values = VariationValue::query()
            ->with('variation')
            ->where(function ($q) use ($numericIds, $uidTokens) {
                if (!empty($numericIds)) {
                    $q->whereIn('id', $numericIds);
                }
                if (!empty($uidTokens)) {
                    if (!empty($numericIds)) {
                        $q->orWhereIn('uid', $uidTokens);
                    } else {
                        $q->whereIn('uid', $uidTokens);
                    }
                }
            })
            ->get();

        $byId = $values->keyBy(fn($value) => (string) $value->id);
        $byUid = $values->keyBy(fn($value) => (string) $value->uid);

        $labels = [];
        foreach ($tokens as $token) {
            $value = ctype_digit($token)
                ? $byId->get((string) (int) $token)
                : $byUid->get($token);

            if (!$value || !$value->variation) {
                continue;
            }

            $labels[$value->variation->name] = $value->label;
        }

        return $labels;
    }

    /**
     * Check if variant has special price currently active.
     */
    public function hasSpecialPrice(): bool
    {
        if ($this->special_price === null) {
            return false;
        }

        $now = now();

        if ($this->special_price_start && $now->lt($this->special_price_start)) {
            return false;
        }

        if ($this->special_price_end && $now->gt($this->special_price_end)) {
            return false;
        }

        return true;
    }

    /**
     * Get the computed special price.
     */
    public function getSpecialPrice(): float
    {
        if ($this->special_price_type === 'percent') {
            return $this->price - ($this->price * ($this->special_price / 100));
        }

        return $this->special_price ?? $this->price;
    }

    public function getHasSpecialPriceAttribute(): bool
    {
        return $this->hasSpecialPrice();
    }

    public function getIsInStockAttribute(): bool
    {
        return (float) $this->qty > 0 || (bool) $this->allow_backorder;
    }

    public function getIsOutOfStockAttribute(): bool
    {
        return !$this->is_in_stock;
    }

    public function getBaseImageAttribute(): ?array
    {
        $first = $this->media->first();
        if ($first) {
            return [
                'id' => $first->id,
                'path' => $first->path,
                'url' => $first->path,
            ];
        }

        return null;
    }

    public function getBaseImageThumbAttribute(): ?array
    {
        $first = $this->media->first();
        if ($first) {
            return [
                'id' => $first->id,
                'path' => $first->thumb_path ?? $first->path,
                'url' => $first->thumb_path ?? $first->path,
            ];
        }

        return null;
    }

    /**
     * Generate name from variation values if not set.
     */
    public function generateName(): string
    {
        $labels = $this->getVariationLabels();
        
        if (empty($labels)) {
            return '';
        }

        return implode(' / ', array_values($labels));
    }
}
