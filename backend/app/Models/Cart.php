<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\User;

class Cart extends Model
{
    protected $fillable = [
        'customer_id',
        'user_id',
        'session_id',
        'subtotal',
        'tax_total',
        'shipping_total',
        'discount_total',
        'total',
        'coupon_id',
        'coupon_discount',
        'currency',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'shipping_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'total' => 'decimal:2',
        'coupon_discount' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum('total_price');
        $this->tax_total = $this->items->sum('tax_amount');
        $this->discount_total = $this->items->sum('discount_amount') + $this->coupon_discount;
        $this->total = $this->subtotal + $this->tax_total + $this->shipping_total - $this->discount_total;
        $this->save();
    }

    public function addItem(Product $product, float $quantity, array $options = [], ?ProductVariant $variant = null, ?int $cartOfferId = null, ?array $offerData = null): CartItem
    {
        // Check if item already exists (only merge if NOT an offer item — offer items are always separate)
        if (!$cartOfferId) {
            $existingItem = $this->items()
                ->where('product_id', $product->id)
                ->when($variant, function ($query) use ($variant) {
                    return $query->where('product_variant_id', $variant->id);
                })
                ->when(empty($variant), function ($query) {
                    return $query->whereNull('product_variant_id');
                })
                ->when($options, function ($query) use ($options) {
                    $driver = $query->getConnection()->getDriverName();
                    if ($driver === 'pgsql') {
                        return $query->whereRaw('options::jsonb = ?::jsonb', [json_encode($options, JSON_UNESCAPED_UNICODE)]);
                    }

                    return $query->where('options', json_encode($options, JSON_UNESCAPED_UNICODE));
                })
                ->whereNull('cart_offer_id')
                ->first();

            if ($existingItem) {
                $existingItem->quantity += $quantity;
                $existingItem->calculateTotals();
                return $existingItem;
            }
        }

        $unitPrice = $offerData
            ? (float) ($offerData['discounted_price'] ?? $variant?->selling_price ?? $product->selling_price ?? 0)
            : (float) ($variant?->selling_price ?? $product->selling_price ?? 0);
        $qty = (float) $quantity;
        $totalPrice = $qty * $unitPrice;
        $taxRate = (float) ($product->taxClass?->rate ?? 0);
        $taxAmount = $totalPrice * ($taxRate / 100);

        $cartItem = $this->items()->create([
            'product_id' => $product->id,
            'product_variant_id' => $variant?->id,
            'sale_unit_id' => $product->sale_unit_id,
            'product_name' => $product->name,
            'product_sku' => $variant?->sku ?? $product->sku,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total_price' => $totalPrice,
            'tax_rate' => $taxRate,
            'tax_amount' => round($taxAmount, 2),
            'discount_amount' => $offerData ? (float) ($offerData['discount_amount'] ?? 0) * $qty : 0,
            'options' => $options,
            'variant_values' => $variant?->values ?? null,
            'cart_offer_id' => $cartOfferId,
            'offer_data' => $offerData,
        ]);

        $this->refresh()->load('items');
        $this->calculateTotals();

        return $cartItem;
    }

    public function removeItem(CartItem $item): void
    {
        $item->delete();
        $this->refresh()->load('items');
        $this->calculateTotals();
    }

    public function clear(): void
    {
        $this->items()->delete();
        $this->update([
            'subtotal' => 0,
            'tax_total' => 0,
            'shipping_total' => 0,
            'discount_total' => 0,
            'total' => 0,
            'coupon_id' => null,
            'coupon_discount' => 0,
        ]);
    }

    public function isEmpty(): bool
    {
        return $this->items()->count() === 0;
    }

    public function itemCount(): float
    {
        return (float) $this->items()->sum('quantity');
    }

    public static function getCurrentCart(?Customer $customer = null, ?string $sessionId = null): self
    {
        if ($customer) {
            $cart = static::where('customer_id', $customer->id)->first();

            if (!$cart && $sessionId) {
                $sessionCart = static::where('session_id', $sessionId)
                    ->whereNull('customer_id')
                    ->first();
                if ($sessionCart) {
                    $sessionCart->update([
                        'customer_id' => $customer->id,
                        'session_id' => null,
                    ]);
                    $cart = $sessionCart;
                }
            }

            if (!$cart) {
                $cart = static::create([
                    'customer_id' => $customer->id,
                    'currency' => 'TRY',
                ]);
            }

            return $cart;
        }

        if ($sessionId) {
            return static::firstOrCreate([
                'session_id' => $sessionId,
                'customer_id' => null,
            ], [
                'currency' => 'TRY',
            ]);
        }

        throw new \InvalidArgumentException('Either user or session_id must be provided');
    }
}
