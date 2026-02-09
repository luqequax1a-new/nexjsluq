@php
    $currency = $order->currency_code ?: 'TRY';
    $formatMoney = function ($amount) use ($currency) {
        return number_format((float) $amount, 2, ',', '.') . ' ' . $currency;
    };
@endphp

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tbody>
        <tr>
            <td style="font-size:14px;padding:4px 0;color:#111827;white-space:nowrap;font-weight:600;">Sipariş No:</td>
            <td style="font-size:14px;padding:4px 0;color:#111827;">#{{ $order->order_number }}</td>
        </tr>
        <tr>
            <td style="font-size:14px;padding:4px 0;color:#111827;white-space:nowrap;font-weight:600;">Tarih:</td>
            <td style="font-size:14px;padding:4px 0;color:#111827;">{{ $orderDate ?? ($order->created_at?->format('d.m.Y H:i') ?? '-') }}</td>
        </tr>
        <tr>
            <td style="font-size:14px;padding:4px 0;color:#111827;white-space:nowrap;font-weight:600;">Durum:</td>
            <td style="font-size:14px;padding:4px 0;color:#111827;">{{ $statusLabel ?? $order->status_label }}</td>
        </tr>
        <tr>
            <td style="font-size:14px;padding:4px 0;color:#111827;white-space:nowrap;font-weight:600;">Ödeme:</td>
            <td style="font-size:14px;padding:4px 0;color:#111827;">
                {{ $paymentMethodLabel ?? ($order->payment_method ?: '-') }}
                @if (!empty($paymentStatusLabel))
                    <span style="color:#64748b;">({{ $paymentStatusLabel }})</span>
                @endif
            </td>
        </tr>
        <tr>
            <td style="font-size:14px;padding:4px 0;color:#111827;white-space:nowrap;font-weight:600;">Toplam:</td>
            <td style="font-size:14px;padding:4px 0;color:#111827;font-weight:700;">{{ $formatMoney($order->grand_total) }}</td>
        </tr>
    </tbody>
</table>
