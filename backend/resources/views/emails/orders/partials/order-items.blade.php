@php
    $currency = $order->currency_code ?: 'TRY';
    $formatMoney = function ($amount) use ($currency) {
        return number_format((float) $amount, 2, ',', '.') . ' ' . $currency;
    };
    $formatQty = function ($qty) {
        $s = number_format((float) $qty, 3, '.', '');
        $s = rtrim(rtrim($s, '0'), '.');
        return $s === '' ? '0' : $s;
    };
    $imageUrl = function ($path) {
        if (!$path) return null;
        $p = trim((string) $path);
        if ($p === '') return null;
        if (str_starts_with($p, 'http')) return $p;
        if (str_starts_with($p, '/media/')) return rtrim(config('app.url'), '/') . '/storage' . $p;
        if (str_starts_with($p, 'media/')) return rtrim(config('app.url'), '/') . '/storage/' . $p;
        if (str_starts_with($p, '/')) return rtrim(config('app.url'), '/') . $p;
        return rtrim(config('app.url'), '/') . '/' . $p;
    };
@endphp

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin: 0 0 14px;">
    <tbody>
    @foreach ($order->items as $item)
        @php
            $unit = $item->product?->unit ?? [];
            $unitPrefix = $unit['stock_prefix'] ?? ($unit['quantity_prefix'] ?? ($unit['suffix'] ?? ''));
            if (!$unitPrefix) {
                $unitPrefix = $item->unit_label ?? '';
            }
            $pricePrefix = $unit['price_prefix'] ?? '';
            $qtyText = $formatQty($item->quantity);
            $optionLabels = [];
            $variantLabels = $item->variant?->getVariationLabels() ?? [];
            foreach ($variantLabels as $label => $value) {
                if ($label !== '' && $value !== '') {
                    $optionLabels[] = $label . ': ' . $value;
                }
            }
            if (is_array($item->options)) {
                foreach ($item->options as $key => $value) {
                    if ($value === null || $value === '') {
                        continue;
                    }
                    $label = (is_string($key) && !is_numeric($key)) ? $key : null;
                    if ($label) {
                        $optionLabels[] = $label . ': ' . $value;
                    } else {
                        $optionLabels[] = $value;
                    }
                }
            }
            $options = count($optionLabels) ? implode(' • ', $optionLabels) : null;
            $img = $imageUrl($item->image);
        @endphp
        <tr>
            <td style="padding:10px 0; border-bottom: 1px solid #e5e7eb;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <tr>
                        <td width="70" valign="top" style="padding-right:12px;">
                            @if ($img)
                                <img src="{{ $img }}" width="64" height="64" alt="{{ $item->name }}" style="display:block;border-radius:10px;border:1px solid #e5e7eb;object-fit:cover;" />
                            @else
                                <div style="width:64px;height:64px;border-radius:10px;border:1px solid #e5e7eb;background:#f8fafc;"></div>
                            @endif
                        </td>
                        <td valign="top">
                            <div style="font-family:'Open Sans',Arial,sans-serif;font-size:14px;font-weight:800;color:#0f172a;line-height:1.3;">
                                {{ $item->name }}
                            </div>
                            @if ($item->sku)
                                <div style="font-size:12px;color:#64748b;margin-top:2px;">Stok Kodu: {{ $item->sku }}</div>
                            @endif
                            @if ($options)
                                <div style="font-size:12px;color:#475569;margin-top:6px;">
                                    {{ $options }}
                                </div>
                            @endif
                            <div style="font-size:12px;color:#475569;margin-top:8px;">
                                <span style="font-weight:700;color:#0f172a;">{{ $qtyText }}</span>
                                @if ($unitPrefix)
                                    <span style="margin-left:2px;color:#0f172a;">{{ $unitPrefix }}</span>
                                @endif
                                <span style="margin:0 6px;color:#0f172a;">×</span>
                                <span>{{ $formatMoney($item->unit_price) }}{{ $pricePrefix }}</span>
                                <span style="margin:0 6px;color:#0f172a;">=</span>
                                <span style="font-weight:800;color:#16a34a;">{{ $formatMoney($item->line_total) }}</span>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    @endforeach
    </tbody>
</table>
