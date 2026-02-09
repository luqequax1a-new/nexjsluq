<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\TestMail;

class MailSettingsController extends Controller
{
    /**
     * Get mail settings.
     */
    public function index()
    {
        $settings = [
            'mail_from_address' => config('mail.from.address') ?: 'test@localhost',
            'mail_from_name' => config('mail.from.name') ?: 'Test App',
            'mail_host' => config('mail.mailers.smtp.host') ?: '127.0.0.1',
            'mail_port' => config('mail.mailers.smtp.port') ?: 1025,
            'mail_username' => config('mail.mailers.smtp.username') ?: '',
            'mail_password' => config('mail.mailers.smtp.password') ? '********' : '',
            'mail_encryption' => config('mail.mailers.smtp.encryption') ?: '',
        ];

        return response()->json($settings);
    }

    /**
     * Update mail settings.
     */
    public function update(Request $request)
    {
        try {
            // Simple update without complex validation
            $envFile = base_path('.env');
            $envContent = file_get_contents($envFile);

            $updates = [
                'MAIL_MAILER' => 'smtp',
                'MAIL_FROM_ADDRESS' => $request->mail_from_address,
                'MAIL_FROM_NAME' => $request->mail_from_name,
                'MAIL_HOST' => $request->mail_host,
                'MAIL_PORT' => $request->mail_port,
                'MAIL_USERNAME' => $request->mail_username,
                'MAIL_ENCRYPTION' => $request->mail_encryption,
            ];

            // Only update password if it's not masked
            if ($request->mail_password !== '********') {
                $updates['MAIL_PASSWORD'] = $request->mail_password;
            }

            foreach ($updates as $key => $value) {
                // Simple string replacement
                $pattern = "/^{$key}=.*/m";
                $replacement = "{$key}=\"" . $value . "\"";
                
                if (preg_match($pattern, $envContent)) {
                    $envContent = preg_replace($pattern, $replacement, $envContent);
                } else {
                    $envContent .= "\n{$replacement}";
                }
            }

            file_put_contents($envFile, $envContent);
            \Artisan::call('config:clear');
            \Artisan::call('config:cache');

            return response()->json(['message' => 'Mail ayarları başarıyla güncellendi.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Hata: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Send test email.
     */
    public function sendTestEmail(Request $request)
    {
        try {
            // Log mail configuration
            \Log::info('Mail configuration:', [
                'mailer' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'encryption' => config('mail.mailers.smtp.encryption'),
                'username' => config('mail.mailers.smtp.username'),
                'from_address' => config('mail.from.address'),
                'from_name' => config('mail.from.name'),
            ]);

            // Test email gönder
            Mail::to($request->test_email)->send(new TestMail());
            
            \Log::info('Test email sent successfully to: ' . $request->test_email);
            return response()->json(['message' => 'Test e-postası gönderildi.']);
        } catch (\Exception $e) {
            \Log::error('Test email failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'test_email' => $request->test_email,
            ]);
            return response()->json(['error' => 'E-posta gönderilemedi: ' . $e->getMessage()], 500);
        }
    }
}
