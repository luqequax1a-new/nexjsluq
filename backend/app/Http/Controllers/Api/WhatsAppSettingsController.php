<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\Log;

class WhatsAppSettingsController extends Controller
{
    private $whatsAppService;

    public function __construct(WhatsAppService $whatsAppService)
    {
        $this->whatsAppService = $whatsAppService;
    }

    public function index()
    {
        $keys = [
            'whatsapp_phone_number_id',
            'whatsapp_token',
            'whatsapp_business_account_id', // Optional
            'whatsapp_notifications_active', // Global toggle
            'whatsapp_template_orders_create', // Template name for new order
            'whatsapp_template_orders_shipped', // Template name for shipped order
        ];
        
        $settings = Setting::whereIn('key', $keys)->pluck('value', 'key');
        
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'whatsapp_phone_number_id' => 'nullable|string',
            'whatsapp_token' => 'nullable|string',
            'whatsapp_business_account_id' => 'nullable|string',
            'whatsapp_notifications_active' => 'boolean',
            'whatsapp_template_orders_create' => 'nullable|string',
            'whatsapp_template_orders_shipped' => 'nullable|string',
            // Add other templates as needed
        ]);

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value] // For booleans, cast to string or int in DB if needed, Setting value is text usually
            );
        }

        return response()->json(['message' => 'WhatsApp settings updated successfully']);
    }

    public function test(Request $request)
    {
        $request->validate([
            'phone' => 'required|string', // with country code
            'template' => 'required|string',
        ]);

        $result = $this->whatsAppService->sendTemplateMessage(
            $request->phone,
            $request->template,
            'tr',
            [] // Components empty for test
        );

        if ($result === true) {
            return response()->json(['message' => 'Test message sent successfully']);
        }

        return response()->json(['message' => 'Failed to send test message: ' . $result], 500);
    }
}
