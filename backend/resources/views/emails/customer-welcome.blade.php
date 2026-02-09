<!doctype html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hos geldiniz</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:24px 12px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr>
                    <td style="padding:24px 24px 8px 24px;text-align:center;background:#ffffff;">
                        @if(!empty($logoUrl))
                            <img src="{{ $logoUrl }}" alt="{{ $storeName }}" style="max-height:52px;max-width:220px;width:auto;height:auto;display:inline-block;">
                        @else
                            <div style="font-size:22px;font-weight:700;color:#111827;">{{ $storeName }}</div>
                        @endif
                    </td>
                </tr>
                <tr>
                    <td style="padding:8px 24px 0 24px;text-align:center;">
                        <div style="font-size:26px;line-height:1.25;font-weight:700;color:#0f172a;">Hos geldiniz, {{ $customer->first_name }}</div>
                        <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#475569;">
                            Hesabiniz basariyla olusturuldu. Artik siparislerinizi takip edebilir, adreslerinizi kaydedebilir ve kuponlarinizi kullanabilirsiniz.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:24px;text-align:center;">
                        <a href="{{ $storeUrl }}/hesap"
                           style="display:inline-block;padding:12px 20px;border-radius:10px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">
                            Hesabima Git
                        </a>
                    </td>
                </tr>
                <tr>
                    <td style="padding:0 24px 24px 24px;">
                        <div style="font-size:13px;line-height:1.6;color:#64748b;text-align:center;">
                            Bu e-postayi siz istemediyseniz lütfen dikkate almayin.
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
