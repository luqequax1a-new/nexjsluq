<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Şifre Sıfırlama</title>
    <style>
      @media screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          border-radius: 0 !important;
        }
        .content {
          padding: 24px !important;
        }
        .header {
          padding: 20px 24px !important;
        }
        .button {
          display: block !important;
          width: 100% !important;
          text-align: center !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 0;">
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="600"
            cellspacing="0"
            cellpadding="0"
            class="container"
            style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;"
          >
            <tr>
              <td class="header" style="background-color: #0f172a; color: #ffffff; padding: 24px 32px;">
                <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.7;">
                  {{ config('app.name') }}
                </div>
                <div style="font-size: 24px; font-weight: 700; margin-top: 8px;">Şifre sıfırlama</div>
                <div style="font-size: 14px; opacity: 0.8; margin-top: 6px;">Hesabınız için yeni bir şifre belirleyin.</div>
              </td>
            </tr>
            <tr>
              <td class="content" style="padding: 32px;">
                <p style="margin: 0 0 12px; font-size: 16px; color: #0f172a;">Merhaba {{ $name }},</p>
                <p style="margin: 0 0 20px; font-size: 14px; color: #475569;">
                  Hesabınız için şifre sıfırlama isteği aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
                </p>
                <div style="text-align: center; margin: 24px 0;">
                  <a
                    href="{{ $resetUrl }}"
                    class="button"
                    style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; display: inline-block; font-weight: 600; font-size: 14px;"
                  >
                    Şifreyi sıfırla
                  </a>
                </div>
                <p style="margin: 0 0 12px; font-size: 14px; color: #475569;">
                  Bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
                </p>
                <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">
                  Bağlantı {{ $expires }} dakika içinde geçersiz olur.
                </p>
                <p style="margin: 16px 0 0; font-size: 12px; color: #64748b; word-break: break-all;">
                  Buton çalışmazsa bu adresi tarayıcınıza kopyalayın:<br />
                  <span style="color: #0f172a;">{{ $resetUrl }}</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f8fafc; padding: 20px 32px; font-size: 12px; color: #64748b; text-align: center;">
                Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.<br />
                © {{ date('Y') }} {{ config('app.name') }}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
