<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\TestMail;

class MailSettingsController extends Controller
{
    /**
     * Display mail settings page.
     */
    public function index()
    {
        $settings = [
            'mail_from_address' => config('mail.from.address'),
            'mail_from_name' => config('mail.from.name'),
            'mail_host' => config('mail.mailers.smtp.host'),
            'mail_port' => config('mail.mailers.smtp.port'),
            'mail_username' => config('mail.mailers.smtp.username'),
            'mail_password' => config('mail.mailers.smtp.password') ? '********' : '',
            'mail_encryption' => config('mail.mailers.smtp.encryption'),
        ];

        return inertia('admin/settings/mail', [
            'settings' => $settings,
            'encryptionProtocols' => [
                '' => 'None',
                'tls' => 'TLS',
                'ssl' => 'SSL',
            ],
        ]);
    }

    /**
     * Update mail settings.
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mail_from_address' => 'required|email',
            'mail_from_name' => 'required|string|max:255',
            'mail_host' => 'required|string|max:255',
            'mail_port' => 'required|integer|min:1|max:65535',
            'mail_username' => 'nullable|string|max:255',
            'mail_password' => 'nullable|string|max:255',
            'mail_encryption' => 'nullable|in:tls,ssl',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Update .env file
        $envFile = base_path('.env');
        $envContent = file_get_contents($envFile);

        $envUpdates = [
            'MAIL_FROM_ADDRESS' => $request->mail_from_address,
            'MAIL_FROM_NAME' => $request->mail_from_name,
            'MAIL_HOST' => $request->mail_host,
            'MAIL_PORT' => $request->mail_port,
            'MAIL_USERNAME' => $request->mail_username,
            'MAIL_ENCRYPTION' => $request->mail_encryption,
        ];

        // Only update password if it's not masked
        if ($request->mail_password !== '********') {
            $envUpdates['MAIL_PASSWORD'] = $request->mail_password;
        }

        foreach ($envUpdates as $key => $value) {
            $pattern = "/^{$key}=.*/m";
            $replacement = "{$key}=" . ($value ? '"' . $value . '"' : '') . "\n";
            
            if (preg_match($pattern, $envContent)) {
                $envContent = preg_replace($pattern, $replacement, $envContent);
            } else {
                $envContent .= "\n{$replacement}";
            }
        }

        file_put_contents($envFile, $envContent);

        // Clear config cache
        \Artisan::call('config:clear');

        return back()->with('success', 'Mail ayarları başarıyla güncellendi.');
    }

    /**
     * Send test email.
     */
    public function sendTestEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'test_email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            Mail::to($request->test_email)->send(new TestMail());
            return back()->with('success', 'Test e-posta başarıyla gönderildi.');
        } catch (\Exception $e) {
            return back()->with('error', 'Test e-posta gönderilemedi: ' . $e->getMessage());
        }
    }
}
