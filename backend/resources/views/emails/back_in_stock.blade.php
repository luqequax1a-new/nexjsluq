<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ürün Tekrar Stokta!</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
        .container { max-width: 600px; margin: 20px auto 0; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
        .content p { margin: 0 0 20px; font-size: 16px; }
        .product-block { background: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
        .product-image { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; border: 1px solid #e2e8f0; background: #fff; }
        .product-name { font-weight: 700; color: #1e293b; font-size: 15px; margin-bottom: 4px; text-decoration: none; display: block; }
        .product-meta { font-size: 12px; color: #64748b; line-height: 1.5; }
        .btn { display: inline-block; background-color: #d97706; color: #ffffff !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 12px; }
        .footer { text-align: center; padding: 20px; font-size: 13px; color: #94a3b8; }
        @media screen and (max-width: 600px) {
            .container { margin-top: 0; border-radius: 0; }
            .product-image { width: 64px; height: 64px; }
        }
    </style>
</head>
@php
    $storeName = config('app.name', 'Mağaza');
    $frontendUrl = config('app.frontend_url', config('app.url'));

    $imageUrl = null;
    if ($variant) {
        $variantMedia = $variant->media()->first();
        $imageUrl = $variantMedia ? ($variantMedia->url ?? $variantMedia->path) : null;
    }
    if (!$imageUrl) {
        $productMedia = $product->media()->first();
        $imageUrl = $productMedia ? ($productMedia->url ?? $productMedia->path) : null;
    }
    if ($imageUrl && !str_starts_with($imageUrl, 'http')) {
        $imageUrl = \Illuminate\Support\Facades\Storage::url($imageUrl);
    }
    $imageUrl = $imageUrl ?: ($frontendUrl . '/placeholder.png');

    $productUrl = $frontendUrl . '/urun/' . $product->slug;
    $sku = $variant ? ($variant->sku ?: $product->sku) : $product->sku;

    $variantLabels = [];
    if ($variant && method_exists($variant, 'getVariationLabels')) {
        $variantLabels = $variant->getVariationLabels();
    }
@endphp
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Beklediğiniz Ürün Tekrar Stokta!</h1>
            </div>

            <div class="content">
                <p>Merhaba,</p>
                <p>Takip ettiğiniz <strong>{{ $product->name }}</strong> ürünü sitemizde tekrar stoklara girdi.</p>

                <div class="product-block">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td width="90" valign="top">
                                <a href="{{ $productUrl }}" target="_blank">
                                    <img src="{{ $imageUrl }}" alt="{{ $product->name }}" class="product-image">
                                </a>
                            </td>
                            <td valign="top" style="padding-left: 15px;">
                                <a href="{{ $productUrl }}" target="_blank" class="product-name">{{ $product->name }}</a>
                                <div class="product-meta">
                                    @if($sku)
                                        <div>Stok Kodu: {{ $sku }}</div>
                                    @endif
                                    @foreach($variantLabels as $name => $label)
                                        <div style="color: #1e293b; font-weight: 600;">{{ $name }}: {{ $label }}</div>
                                    @endforeach
                                    <a href="{{ $productUrl }}" class="btn" target="_blank">Hemen İncele</a>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <p>Ürünlerimizin hızlıca tükenebileceğini hatırlatmak isteriz. Fırsatı kaçırmadan sepetinize ekleyebilirsiniz.</p>
                <p>Keyifli alışverişler dileriz!</p>
            </div>

            <div class="footer">
                <p>&copy; {{ date('Y') }} {{ $storeName }}. Tüm hakları saklıdır.</p>
                <p>Bu e-postayı, ürün stoğa geldiğinde haber verilmesini istediğiniz için aldınız.</p>
            </div>
        </div>
    </div>
</body>
</html>
