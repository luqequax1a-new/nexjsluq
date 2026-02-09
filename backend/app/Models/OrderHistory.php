<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'user_id',
        'status',
        'payment_status',
        'action',
        'note',
        'meta',
        'is_customer_notified',
    ];

    protected $casts = [
        'meta' => 'array',
        'is_customer_notified' => 'boolean',
    ];

    /**
     * Action labels (Turkish)
     */
    public static function actionLabels(): array
    {
        return [
            'created' => 'Sipariş Oluşturuldu',
            'status_change' => 'Durum Değişikliği',
            'payment_status_change' => 'Ödeme Durumu Değişikliği',
            'payment_received' => 'Ödeme Alındı',
            'shipped' => 'Kargoya Verildi',
            'delivered' => 'Teslim Edildi',
            'note_added' => 'Not Eklendi',
            'refund_requested' => 'İade Talebi',
            'refund_completed' => 'İade Tamamlandı',
            'cancelled' => 'İptal Edildi',
        ];
    }

    /**
     * Action icons
     */
    public static function actionIcons(): array
    {
        return [
            'created' => 'plus-circle',
            'status_change' => 'refresh',
            'payment_status_change' => 'dollar',
            'payment_received' => 'check-circle',
            'shipped' => 'truck',
            'delivered' => 'home',
            'note_added' => 'message',
            'refund_requested' => 'undo',
            'refund_completed' => 'check',
            'cancelled' => 'close-circle',
        ];
    }

    /**
     * Order relationship
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * User who performed the action
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get action label
     */
    public function getActionLabelAttribute(): string
    {
        return self::actionLabels()[$this->action] ?? $this->action;
    }

    /**
     * Get action icon
     */
    public function getActionIconAttribute(): string
    {
        return self::actionIcons()[$this->action] ?? 'info-circle';
    }
}
