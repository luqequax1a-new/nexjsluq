<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OrderObserver
{
    /**
     * Handle the Order "created" event.
     */
    public function created(Order $order): void
    {
        // 1. Is global WhatsApp active?
        if (!$this->isWhatsAppActive()) return;

        // 2. Is 'Order Created' notification active?
        if (!$this->getSetting('whatsapp_order_create_active')) return;

        // 3. Get template name
        $templateName = $this->getSetting('whatsapp_template_orders_create');
        if (!$templateName) return;

        $this->sendMessage($order, $templateName, 'created');
    }

    /**
     * Handle the Order "updated" event.
     */
    public function updated(Order $order): void
    {
        // Only if status changed
        if (!$order->isDirty('status')) return;

        // 1. Is global WhatsApp active?
        if (!$this->isWhatsAppActive()) return;

        // Dynamic status handling
        $status = $order->status; // pending, confirmed, processing, shipped, delivered, cancelled, refunded
        
        $activeKey = "whatsapp_order_{$status}_active";
        $templateKey = "whatsapp_template_orders_{$status}";

        if (!$this->getSetting($activeKey)) return;
        
        $templateName = $this->getSetting($templateKey);
        if (!$templateName) return;
        
        $this->sendMessage($order, $templateName, $status);
    }

    private function getSetting($key)
    {
        $value = Setting::where('key', $key)->value('value');
        if ($value === 'true' || $value === '1' || $value === true) return true;
        if ($value === 'false' || $value === '0' || $value === false) return false;
        return $value;
    }

    private function isWhatsAppActive()
    {
        return $this->getSetting('whatsapp_notifications_active') === true;
    }

    private function sendMessage(Order $order, $templateName, $type)
    {
        try {
            // Get credentials
            $token = $this->getSetting('whatsapp_token');
            $phoneId = $this->getSetting('whatsapp_phone_number_id');

            if (!$token || !$phoneId) {
                Log::warning("WhatsApp credentials missing for auto-message order #{$order->id}");
                return;
            }

            // Get customer phone
            $phone = null;
            $customerName = 'Müşteri';

            if ($order->billingAddress) {
                $phone = $order->billingAddress->phone;
                $customerName = $order->billingAddress->first_name;
            } elseif ($order->customer) {
                $phone = $order->customer->phone;
                $customerName = $order->customer->first_name;
            }

            if (!$phone) {
                Log::warning("No phone number found for order #{$order->id}");
                return;
            }

            // Clean phone number
            $phone = preg_replace('/^(\+|00)/', '', $phone);
            
            // Prepare template components (variables)
            $components = [];

            // Define parameter logic based on message type
            if ($type === 'shipped') {
                // Expected Template Vars: {{1}}=Name, {{2}}=OrderNo, {{3}}=Carrier, {{4}}=Tracking
                $components = [
                    [
                        'type' => 'body',
                        'parameters' => [
                            ['type' => 'text', 'text' => $customerName ?: 'Sayın Müşterimiz'],
                            ['type' => 'text', 'text' => $order->order_number],
                            ['type' => 'text', 'text' => $order->shipping_carrier ?: 'Kargo Firmamız'],
                            ['type' => 'text', 'text' => $order->shipping_tracking_number ?: '(Takip No Bekleniyor)'],
                        ]
                    ]
                ];
            } else {
                // Default for: created, confirmed, processing, delivered, cancelled, refunded
                // Expects: {{1}}=Name, {{2}}=OrderNo, {{3}}=Amount (Optional in template but sent anyway)
                $components = [
                    [
                        'type' => 'body',
                        'parameters' => [
                            ['type' => 'text', 'text' => $customerName ?: 'Sayın Müşterimiz'],
                            ['type' => 'text', 'text' => $order->order_number],
                            ['type' => 'text', 'text' => number_format($order->grand_total, 2) . ' TL'],
                        ]
                    ]
                ];
            }

            // Send via HTTP (Replicating WhatsAppService logic to avoid DI complexity in Observer if not registered)
            // Or better, use the service if available.
            
            $url = "https://graph.facebook.com/v17.0/{$phoneId}/messages";
            
            $response = Http::withToken($token)->post($url, [
                'messaging_product' => 'whatsapp',
                'to' => $phone,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => ['code' => 'tr'],
                    'components' => $components
                ]
            ]);

            if ($response->successful()) {
                Log::info("WhatsApp auto-message sent for order #{$order->id} ({$type})");
            } else {
                Log::error("WhatsApp API Error: " . $response->body());
            }

        } catch (\Exception $e) {
            Log::error("WhatsApp Observer Exception: " . $e->getMessage());
        }
    }
}
