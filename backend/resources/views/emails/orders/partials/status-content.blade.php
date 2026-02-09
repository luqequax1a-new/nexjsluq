<div style="font-family:'Open Sans',Arial,sans-serif;font-size:14px;line-height:22px;color:#374151;margin-bottom:16px;">
    {{ $messageText }}
</div>

@if (!empty($order->shipping_carrier) || !empty($order->shipping_tracking_number))
    @if ($order->status === 'shipped')
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 18px;">
            <tr>
                <td style="padding: 14px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb;">
                    <div style="font-family:'Open Sans',Arial,sans-serif;font-size:15px;line-height:22px;color:#0f172a;font-weight:800;margin-bottom:6px;">
                        Kargo Bilgileri
                    </div>
                    @if (!empty($order->shipping_carrier))
                        <div style="font-size:13px;color:#374151;margin-top:4px;">
                            <strong style="color:#111827;">Kargo:</strong> {{ $order->shipping_carrier }}
                        </div>
                    @endif
                    @if (!empty($order->shipping_tracking_number))
                        <div style="font-size:13px;color:#374151;margin-top:4px;">
                            <strong style="color:#111827;">Takip No:</strong> {{ $order->shipping_tracking_number }}
                        </div>
                    @endif
                </td>
            </tr>
        </table>
    @endif
@endif

@include('emails.orders.partials.order-items')

@include('emails.orders.partials.order-summary')

@if (!empty($actionUrl))
    <div style="text-align:center;margin-top:18px;">
        <a href="{{ $actionUrl }}" style="font-family:'Open Sans',Arial,sans-serif;font-weight:700;text-decoration:none;display:inline-block;background: {{ $brandColor ?? '#111827' }};color:#ffffff;padding:11px 26px;border-radius:8px;">
            {{ $actionText ?? 'Siparişi Görüntüle' }}
        </a>
    </div>
@endif
