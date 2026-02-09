<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderStatusChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Order $order;
    public ?string $previousStatus;
    public string $storeName;
    public ?string $storeEmail;
    public ?string $storePhone;
    public ?string $logoUrl;
    public string $brandColor;
    public string $heading;
    public string $messageText;
    public string $statusLabel;
    public string $paymentStatusLabel;
    public string $paymentMethodLabel;
    public string $storeUrl;
    public string $actionUrl;
    public string $actionText;
    public string $orderDate;

    public function __construct(Order $order, ?string $previousStatus = null)
    {
        $this->order = $order->loadMissing(['items.product', 'items.variant', 'billingAddress', 'shippingAddress', 'customer']);
        $this->previousStatus = $previousStatus;

        $settings = Setting::query()
            ->whereIn('key', [
                'store_name',
                'store_email',
                'store_phone',
                'logo',
                'storefront_mail_theme_color',
            ])
            ->pluck('value', 'key');

        $this->storeName = (string) ($settings['store_name'] ?? config('app.name', 'Mağaza'));
        $this->storeEmail = $settings['store_email'] ?? null;
        $this->storePhone = $settings['store_phone'] ?? null;
        $this->logoUrl = $settings['logo'] ?? null;
        $this->brandColor = (string) ($settings['storefront_mail_theme_color'] ?? '#111827');

        $this->statusLabel = $order->status_label;
        $this->paymentStatusLabel = $order->payment_status_label;
        $this->paymentMethodLabel = $this->resolvePaymentMethodLabel($order->payment_method);
        $this->heading = $this->makeHeading();
        $this->messageText = $this->makeMessage();
        $this->storeUrl = $this->makeBaseUrl();
        $this->actionUrl = $this->makeOrderUrl();
        $this->actionText = 'Siparişi Görüntüle';
        $this->orderDate = $order->created_at
            ? $order->created_at->format('d.m.Y H:i')
            : now()->format('d.m.Y H:i');
    }

    public function build()
    {
        return $this->subject($this->makeSubject())
            ->view('emails.orders.' . $this->getViewName());
    }

    protected function getViewName(): string
    {
        return match ($this->order->status) {
            'shipped' => 'status_shipped',
            'delivered' => 'status_delivered',
            'cancelled' => 'status_cancelled',
            'refunded' => 'status_refunded',
            'confirmed' => 'status_confirmed',
            'processing' => 'status_processing',
            default => 'status',
        };
    }

    protected function makeBaseUrl(): string
    {
        return rtrim((string) config('app.frontend_url', config('app.url')), '/');
    }

    protected function makeOrderUrl(): string
    {
        return $this->makeBaseUrl() . '/hesap/siparisler/' . $this->order->id;
    }

    protected function resolvePaymentMethodLabel(?string $code): string
    {
        if (!$code) {
            return '-';
        }

        $method = PaymentMethod::query()->where('code', $code)->first();

        if ($method && $method->name) {
            return $method->name;
        }

        return $code;
    }

    protected function makeHeading(): string
    {
        return match ($this->order->status) {
            'shipped' => 'Siparişiniz Kargoya Verildi',
            'delivered' => 'Siparişiniz Teslim Edildi',
            'cancelled' => 'Siparişiniz İptal Edildi',
            'refunded' => 'İadeniz Tamamlandı',
            'confirmed' => 'Siparişiniz Onaylandı',
            'processing' => 'Siparişiniz Hazırlanıyor',
            default => 'Sipariş Durumu Güncellendi',
        };
    }

    protected function makeSubject(): string
    {
        return match ($this->order->status) {
            'shipped' => "{$this->storeName} – Siparişiniz Kargoya Verildi",
            'delivered' => "{$this->storeName} – Siparişiniz Teslim Edildi",
            'cancelled' => "{$this->storeName} – Siparişiniz İptal Edildi",
            'refunded' => "{$this->storeName} – İadeniz Tamamlandı",
            'confirmed' => "{$this->storeName} – Siparişiniz Onaylandı",
            'processing' => "{$this->storeName} – Siparişiniz Hazırlanıyor",
            default => "{$this->storeName} – Sipariş Durumu Güncellendi",
        };
    }

    protected function makeMessage(): string
    {
        return match ($this->order->status) {
            'shipped' => "Siparişiniz kargoya verildi. Takip bilgileri aşağıdadır.",
            'delivered' => "Siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz.",
            'cancelled' => "Siparişiniz iptal edildi. Bir yanlışlık olduğunu düşünüyorsanız bize ulaşabilirsiniz.",
            'refunded' => "İade süreciniz tamamlandı. İade bilgileri kartınıza yansıtılmıştır.",
            'confirmed' => "Siparişiniz onaylandı ve hazırlığa alındı.",
            'processing' => "Siparişiniz hazırlanıyor. Kısa süre içinde kargoya verilecektir.",
            default => "Siparişiniz (#{$this->order->order_number}) durumu güncellendi: {$this->statusLabel}.",
        };
    }
}
