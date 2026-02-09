<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test E-posta</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-bottom: 3px solid #007bff;
        }
        .content {
            padding: 30px 20px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Test E-posta Başarılı!</h1>
    </div>
    
    <div class="content">
        <p>Merhaba,</p>
        
        <p>Bu bir test e-postasıdır. Mail ayarlarınız başarıyla yapılandırılmış ve çalışmaktadır.</p>
        
        <p><strong>Gönderim Zamanı:</strong> {{ now()->format('d.m.Y H:i:s') }}</p>
        
        <p>Eğer bu e-postayı alıyorsanız, mail sunucu ayarlarınız doğru yapılandırılmıştır.</p>
        
        <div style="text-align: center;">
            <a href="{{ config('app.url') }}" class="btn">Sitemizi Ziyaret Et</a>
        </div>
        
        <p>Teşekkürler,<br>{{ config('app.name') }} Ekibi</p>
    </div>
    
    <div class="footer">
        <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
        <p>&copy; {{ date('Y') }} {{ config('app.name') }}. Tüm hakları saklıdır.</p>
    </div>
</body>
</html>
