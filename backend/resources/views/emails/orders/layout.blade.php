<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ $storeName ?? config('app.name', 'Mağaza') }}</title>
    <style>
        @media screen and (max-width: 640px) {
            .container { width: 100% !important; }
            .px-24 { padding-left: 16px !important; padding-right: 16px !important; }
            .title { font-size: 20px !important; line-height: 28px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
    <tr>
        <td align="center" style="padding:24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" class="container" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
                <tr>
                    <td style="background: {{ $brandColor ?? '#111827' }}; padding: 20px; text-align:center;">
                        @if (!empty($logoUrl))
                            <img src="{{ $logoUrl }}" alt="{{ $storeName ?? 'Mağaza' }}" style="height:40px;display:inline-block;vertical-align:middle;" />
                        @else
                            <div style="font-family:'Open Sans',Arial,sans-serif;font-size:20px;line-height:28px;font-weight:700;color:#ffffff;">
                                {{ $storeName ?? config('app.name', 'Mağaza') }}
                            </div>
                        @endif
                        @isset($heading)
                            <div class="title" style="font-family:'Open Sans',Arial,sans-serif;font-size:24px;line-height:32px;font-weight:800;color:#fafafa;margin-top:10px;">
                                {{ $heading }}
                            </div>
                        @endisset
                        <div style="font-family:'Open Sans',Arial,sans-serif;font-size:14px;line-height:20px;font-weight:600;color:#e5e7eb;margin-top:6px;">
                            #{{ $order->order_number }}
                        </div>
                    </td>
                </tr>

                <tr>
                    <td class="px-24" style="padding:24px;">
                        @yield('content')
                    </td>
                </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" class="container" style="width:100%;max-width:600px;margin-top:12px;background:#f9fafb;border-radius:12px;">
                <tr>
                    <td style="padding:14px 20px;text-align:center;font-family:'Open Sans',Arial,sans-serif;font-size:13px;line-height:20px;color:#6b7280;">
                        Teşekkürler, {{ $storeName ?? config('app.name', 'Mağaza') }}
                        @if (!empty($storeEmail) || !empty($storePhone))
                            <div style="margin-top:6px;">
                                @if (!empty($storePhone))
                                    <a href="tel:{{ $storePhone }}" style="color:#6b7280;text-decoration:none;">{{ $storePhone }}</a>
                                @endif
                                @if (!empty($storePhone) && !empty($storeEmail))
                                    <span style="margin:0 6px;">•</span>
                                @endif
                                @if (!empty($storeEmail))
                                    <a href="mailto:{{ $storeEmail }}" style="color:#6b7280;text-decoration:none;">{{ $storeEmail }}</a>
                                @endif
                            </div>
                        @endif
                        <div style="margin-top:8px;">
                            <a href="{{ $storeUrl ?? config('app.url') }}" style="color:#6b7280;text-decoration:underline;">Mağazayı ziyaret et</a>
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
