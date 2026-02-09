<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private $apiUrl = 'https://graph.facebook.com/v17.0'; // Version may wary
    private $phoneNumberId;
    private $token;

    public function __construct()
    {
        $this->loadSettings();
    }

    private function loadSettings()
    {
        $this->phoneNumberId = Setting::where('key', 'whatsapp_phone_number_id')->value('value');
        $this->token = Setting::where('key', 'whatsapp_token')->value('value');
    }

    public function isConfigured()
    {
        return $this->phoneNumberId && $this->token;
    }

    /**
     * Send a template message
     *
     * @param string $to Phone number (with country code, no +)
     * @param string $templateName Name of the template in Meta Business Manager
     * @param string $languageCode Language code (e.g. tr)
     * @param array $components Components for the template (header, body parameters etc.)
     * @return bool|string True on success, error message on failure
     */
    public function sendTemplateMessage($to, $templateName, $languageCode = 'tr', $components = [])
    {
        if (!$this->isConfigured()) {
            Log::warning('WhatsApp is not configured properly.');
            return 'WhatsApp is not configured properly.';
        }

        $url = "{$this->apiUrl}/{$this->phoneNumberId}/messages";

        try {
            $response = Http::withToken($this->token)->post($url, [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => [
                        'code' => $languageCode
                    ],
                    'components' => $components
                ]
            ]);

            if ($response->successful()) {
                Log::info("WhatsApp message sent to {$to}: Template {$templateName}");
                return true;
            }

            Log::error("WhatsApp API Error: " . $response->body());
            return $response->json()['error']['message'] ?? 'Unknown API error';

        } catch (\Exception $e) {
            Log::error("WhatsApp Exception: " . $e->getMessage());
            return $e->getMessage();
        }
    }
}
