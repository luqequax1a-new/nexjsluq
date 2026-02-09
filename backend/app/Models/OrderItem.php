<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'product_variant_id',
        'name',
        'sku',
        'options',
        'image',
        'unit_price',
        'quantity',
        'unit_label',
        'tax_rate',
        'tax_amount',
        'discount_amount',
        'line_total',
        'refunded_quantity',
        'refunded_amount',
        'offer_data',
    ];

    protected $casts = [
        'options' => 'array',
        'offer_data' => 'array',
        'unit_price' => 'decimal:2',
        'quantity' => 'decimal:3',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'line_total' => 'decimal:2',
        'refunded_quantity' => 'decimal:3',
        'refunded_amount' => 'decimal:2',
    ];

    /**
     * Order relationship
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Product relationship
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Product variant relationship
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    /**
     * Calculate line total
     */
    public function calculateTotal(): void
    {
        $subtotal = $this->unit_price * $this->quantity;
        $taxAmount = $subtotal * ($this->tax_rate / 100);
        $lineTotal = $subtotal + $taxAmount - $this->discount_amount;

        $this->update([
            'tax_amount' => round($taxAmount, 2),
            'line_total' => round($lineTotal, 2),
        ]);
    }

    /**
     * Get remaining refundable quantity
     */
    public function getRefundableQuantityAttribute(): float
    {
        return $this->quantity - $this->refunded_quantity;
    }

    /**
     * Get remaining refundable amount
     */
    public function getRefundableAmountAttribute(): float
    {
        return $this->line_total - $this->refunded_amount;
    }

    /**
     * Check if fully refunded
     */
    public function isFullyRefunded(): bool
    {
        return $this->refunded_quantity >= $this->quantity;
    }

    /**
     * Create from product
     */
    public static function createFromProduct(
        int $orderId,
        Product $product,
        float $quantity,
        ?ProductVariant $variant = null,
        ?float $customPrice = null
    ): self {
        $price = $customPrice ?? ($variant ? $variant->selling_price ?? $variant->price : $product->selling_price ?? $product->price);
        $taxRate = $product->taxClass ? $product->taxClass->rate : 0;
        
        $subtotal = $price * $quantity;
        $taxAmount = $subtotal * ($taxRate / 100);
        
        // Get options from variant (variation labels like "Renk: Kırmızı")
        $options = null;
        if ($variant) {
            // Primary: use getVariationLabels() which resolves from uids
            $labels = $variant->getVariationLabels();
            if (!empty($labels)) {
                $options = $labels;
            }
            // Fallback: use the stored values JSON array
            if (empty($options) && is_array($variant->values) && !empty($variant->values)) {
                $options = [];
                foreach ($variant->values as $key => $val) {
                    if (is_array($val)) {
                        $label = $val['label'] ?? $val['value'] ?? $val['name'] ?? null;
                        $name = $val['variation'] ?? $val['variation_name'] ?? (string) $key;
                        if ($label) {
                            $options[$name] = $label;
                        }
                    } elseif (is_string($val)) {
                        $options[(string) $key] = $val;
                    }
                }
                if (empty($options)) {
                    $options = null;
                }
            }
        }

        // Get image
        $image = null;
        if ($variant && $variant->media->first()) {
            $image = $variant->media->first()->path;
        } elseif ($product->media->first()) {
            $image = $product->media->first()->path;
        }

        return self::create([
            'order_id' => $orderId,
            'product_id' => $product->id,
            'product_variant_id' => $variant?->id,
            'name' => $product->name . ($variant ? ' - ' . $variant->name : ''),
            'sku' => $variant?->sku ?? $product->sku,
            'options' => $options,
            'image' => $image,
            'unit_price' => $price,
            'quantity' => $quantity,
            'unit_label' => $product->unit['label'] ?? 'Adet',
            'tax_rate' => $taxRate,
            'tax_amount' => round($taxAmount, 2),
            'discount_amount' => 0,
            'line_total' => round($subtotal + $taxAmount, 2),
        ]);
    }
}
