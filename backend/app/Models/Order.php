<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\OrderStatusChangedMail;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number',
        'customer_id',
        'user_id',
        'status',
        'payment_status',
        'payment_method',
        'payment_reference',
        'subtotal',
        'tax_total',
        'shipping_total',
        'payment_fee',
        'discount_total',
        'grand_total',
        'currency_code',
        'currency_rate',
        'coupon_code',
        'coupon_discount',
        'shipping_method',
        'shipping_tracking_number',
        'shipping_carrier',
        'shipped_at',
        'delivered_at',
        'customer_note',
        'admin_note',
        'invoice_number',
        'invoiced_at',
        'source',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'shipping_total' => 'decimal:2',
        'payment_fee' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'currency_rate' => 'decimal:4',
        'coupon_discount' => 'decimal:2',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'invoiced_at' => 'datetime',
    ];

    /**
     * Status labels (Turkish)
     */
    public static function statusLabels(): array
    {
        return [
            'pending' => 'Beklemede',
            'confirmed' => 'Onaylandı',
            'processing' => 'Hazırlanıyor',
            'shipped' => 'Kargoya Verildi',
            'delivered' => 'Teslim Edildi',
            'cancelled' => 'İptal Edildi',
            'refunded' => 'İade Edildi',
        ];
    }

    /**
     * Payment status labels (Turkish)
     */
    public static function paymentStatusLabels(): array
    {
        return [
            'pending' => 'Ödeme Bekleniyor',
            'paid' => 'Ödendi',
            'failed' => 'Başarısız',
            'refunded' => 'İade Edildi',
            'partial_refund' => 'Kısmi İade',
        ];
    }

    /**
     * Status colors for UI
     */
    public static function statusColors(): array
    {
        return [
            'pending' => 'warning',
            'confirmed' => 'processing',
            'processing' => 'processing',
            'shipped' => 'cyan',
            'delivered' => 'success',
            'cancelled' => 'error',
            'refunded' => 'default',
        ];
    }

    /**
     * Payment status colors for UI
     */
    public static function paymentStatusColors(): array
    {
        return [
            'pending' => 'warning',
            'paid' => 'success',
            'failed' => 'error',
            'refunded' => 'default',
            'partial_refund' => 'orange',
        ];
    }

    /**
     * Generate unique order number
     */
    public static function generateOrderNumber(): string
    {
        /** @var \App\Services\SkuGeneratorService $skuService */
        $skuService = app(\App\Services\SkuGeneratorService::class);

        $prefixPattern = $skuService->getOrderPrefixPattern();

        $lastOrder = self::withTrashed()
            ->where('order_number', 'like', "{$prefixPattern}%")
            ->orderByDesc('id')
            ->first();

        $lastSequence = 0;
        if ($lastOrder) {
            $afterPrefix = Str::after($lastOrder->order_number, $prefixPattern);
            $lastSequence = (int) preg_replace('/[^0-9]/', '', $afterPrefix);
        }

        return $skuService->generateOrderNumber($lastSequence);
    }

    /**
     * Boot method
     */
    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (empty($order->order_number)) {
                // Retry mechanism to prevent race condition
                $maxRetries = 5;
                for ($i = 0; $i < $maxRetries; $i++) {
                    try {
                        $order->order_number = self::generateOrderNumber();
                        break;
                    } catch (\Illuminate\Database\QueryException $e) {
                        // If unique constraint violation, retry
                        if ($e->getCode() === '23000' && $i < $maxRetries - 1) {
                            usleep(100000); // Wait 100ms before retry
                            continue;
                        }
                        throw $e;
                    }
                }
            }
        });
    }

    // ========== RELATIONSHIPS ==========

    /**
     * Customer relationship
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Admin user who created/handled the order
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Order items
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Order addresses
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(OrderAddress::class);
    }

    /**
     * Billing address
     */
    public function billingAddress(): HasOne
    {
        return $this->hasOne(OrderAddress::class)->where('type', 'billing');
    }

    /**
     * Shipping address
     */
    public function shippingAddress(): HasOne
    {
        return $this->hasOne(OrderAddress::class)->where('type', 'shipping');
    }

    /**
     * Order history
     */
    public function histories(): HasMany
    {
        return $this->hasMany(OrderHistory::class)->orderByDesc('created_at');
    }

    // ========== HELPERS ==========

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        return self::statusLabels()[$this->status] ?? $this->status;
    }

    /**
     * Get payment status label
     */
    public function getPaymentStatusLabelAttribute(): string
    {
        return self::paymentStatusLabels()[$this->payment_status] ?? $this->payment_status;
    }

    /**
     * Resolve the best email for customer notifications
     */
    public function getNotificationEmail(): ?string
    {
        $billingEmail = $this->billingAddress?->email;
        if ($billingEmail) {
            return $billingEmail;
        }

        $shippingEmail = $this->shippingAddress?->email;
        if ($shippingEmail) {
            return $shippingEmail;
        }

        $customerEmail = $this->customer?->email;
        if ($customerEmail) {
            return $customerEmail;
        }

        $email = $this->billingAddress()->value('email')
            ?? $this->shippingAddress()->value('email')
            ?? $this->customer()->value('email');

        return $email ?: null;
    }

    /**
     * Resolve a display name for customer notifications
     */
    public function getNotificationName(): string
    {
        $name = $this->billingAddress?->full_name
            ?: $this->shippingAddress?->full_name
            ?: trim((string) ($this->customer?->first_name ?? '') . ' ' . (string) ($this->customer?->last_name ?? ''));

        $name = trim((string) $name);

        if ($name !== '') {
            return $name;
        }

        return 'Müşterimiz';
    }

    /**
     * Check if order can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'confirmed', 'processing']);
    }

    /**
     * Check if order can be refunded
     */
    public function canBeRefunded(): bool
    {
        return $this->payment_status === 'paid' && !in_array($this->status, ['refunded']);
    }

    /**
     * Calculate totals from items
     */
    public function calculateTotals(): void
    {
        $items = $this->items;
        
        // subtotal = sum of (unit_price * quantity) per item (before tax and discount)
        $subtotal = $items->sum(fn($item) => (float) $item->unit_price * (float) $item->quantity);
        $taxTotal = $items->sum('tax_amount');
        $itemDiscount = $items->sum('discount_amount');
        
        $this->update([
            'subtotal' => round($subtotal, 2),
            'tax_total' => round($taxTotal, 2),
            'grand_total' => round($subtotal + $taxTotal + (float) $this->shipping_total + (float) $this->payment_fee - (float) $this->discount_total, 2),
        ]);
    }

    /**
     * Add history entry
     */
    public function addHistory(string $action, ?string $note = null, ?string $status = null, ?string $paymentStatus = null, ?int $userId = null): OrderHistory
    {
        return $this->histories()->create([
            'user_id' => $userId,
            'action' => $action,
            'status' => $status,
            'payment_status' => $paymentStatus,
            'note' => $note,
        ]);
    }

    /**
     * Update status with history
     */
    public function updateStatus(string $newStatus, ?string $note = null, ?int $userId = null, bool $notifyCustomer = true): void
    {
        $oldStatus = $this->status;
        $this->update(['status' => $newStatus]);
        
        $history = $this->addHistory(
            'status_change',
            $note ?? "Durum güncellendi: {$oldStatus} → {$newStatus}",
            $newStatus,
            null,
            $userId
        );

        // Update timestamps based on status
        if ($newStatus === 'shipped' && !$this->shipped_at) {
            $this->update(['shipped_at' => now()]);
        }
        if ($newStatus === 'delivered' && !$this->delivered_at) {
            $this->update(['delivered_at' => now()]);
            
            // Update customer stats and auto-assign to groups
            if ($this->customer) {
                $customerId = $this->customer->id;
                DB::afterCommit(function () use ($customerId) {
                    $customer = \App\Models\Customer::find($customerId);
                    if (!$customer) return;
                    
                    // Update customer statistics
                    $customer->updateStats();
                    
                    // Auto-assign to customer groups based on rules
                    $groups = \App\Models\CustomerGroup::where('is_active', true)
                        ->whereNotNull('auto_assignment_rules')
                        ->get();
                    
                    foreach ($groups as $group) {
                        if ($group->shouldAutoAssign($customer)) {
                            $group->assignCustomer($customer);
                        }
                    }
                });
            }
        }

        if ($notifyCustomer && $oldStatus !== $newStatus) {
            $orderId = $this->id;
            $historyId = $history->id;
            DB::afterCommit(function () use ($orderId, $historyId, $oldStatus) {
                $order = self::with(['billingAddress', 'shippingAddress', 'customer'])->find($orderId);
                if (!$order) {
                    return;
                }

                $email = $order->getNotificationEmail();
                if (!$email) {
                    return;
                }

                try {
                    Mail::to($email)->send(new OrderStatusChangedMail($order, $oldStatus));
                    OrderHistory::whereKey($historyId)->update(['is_customer_notified' => true]);
                } catch (\Throwable $e) {
                    Log::error('order.status_email_failed', [
                        'order_id' => $orderId,
                        'status' => $order->status,
                        'error' => $e->getMessage(),
                    ]);
                }
            });
        }
    }

    /**
     * Update payment status with history
     */
    public function updatePaymentStatus(string $newStatus, ?string $note = null, ?int $userId = null): void
    {
        $oldStatus = $this->payment_status;
        $this->update(['payment_status' => $newStatus]);
        
        $this->addHistory(
            'payment_status_change',
            $note ?? "Ödeme durumu güncellendi: {$oldStatus} → {$newStatus}",
            null,
            $newStatus,
            $userId
        );
    }

    /**
     * Decrease product stock when order is confirmed
     */
    public function decreaseStock(): void
    {
        foreach ($this->items as $item) {
            if ($item->product_variant_id && $item->variant) {
                // Use atomic decrement to prevent race conditions
                DB::table('product_variants')
                    ->where('id', $item->variant->id)
                    ->decrement('qty', $item->quantity);
                
                // Update in_stock status
                $variant = $item->variant->fresh();
                $variant->in_stock = (bool) $variant->allow_backorder || $variant->qty > 0;
                $variant->save();
            } elseif ($item->product) {
                // Use atomic decrement to prevent race conditions
                DB::table('products')
                    ->where('id', $item->product->id)
                    ->decrement('qty', $item->quantity);
                
                // Update in_stock status
                $product = $item->product->fresh();
                $product->in_stock = (bool) $product->allow_backorder || $product->qty > 0;
                $product->save();
            }
        }
    }

    /**
     * Restore product stock when order is cancelled
     */
    public function restoreStock(): void
    {
        foreach ($this->items as $item) {
            if ($item->product_variant_id && $item->variant) {
                // Use atomic increment to prevent race conditions
                DB::table('product_variants')
                    ->where('id', $item->variant->id)
                    ->increment('qty', $item->quantity);
                
                // Update in_stock status
                $variant = $item->variant->fresh();
                $variant->in_stock = (bool) $variant->allow_backorder || $variant->qty > 0;
                $variant->save();
            } elseif ($item->product) {
                // Use atomic increment to prevent race conditions
                DB::table('products')
                    ->where('id', $item->product->id)
                    ->increment('qty', $item->quantity);
                
                // Update in_stock status
                $product = $item->product->fresh();
                $product->in_stock = (bool) $product->allow_backorder || $product->qty > 0;
                $product->save();
            }
        }
    }
}
