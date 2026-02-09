<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentMethodController extends Controller
{
    /**
     * Get enabled payment methods for storefront.
     */
    public function index(Request $request): JsonResponse
    {
        $amount = $request->get('amount', 0);
        
        $paymentMethods = PaymentMethod::enabled()
            ->ordered()
            ->get()
            ->filter(function ($method) use ($amount) {
                return $method->isAvailableForAmount($amount);
            })
            ->map(function ($method) use ($amount) {
                return [
                    'id' => $method->id,
                    'name' => $method->name,
                    'code' => $method->code,
                    'description' => $method->description,
                    'settings' => $method->settings,
                    'fee_amount' => $method->getFeeAmount($amount),
                    'fee_text' => $method->fee_text,
                ];
            })
            ->values();

        return response()->json($paymentMethods);
    }

    /**
     * Get payment method by code.
     */
    public function show(string $code, Request $request): JsonResponse
    {
        $amount = $request->get('amount', 0);
        
        $paymentMethod = PaymentMethod::enabled()
            ->where('code', $code)
            ->first();

        if (!$paymentMethod) {
            return response()->json(['error' => 'Payment method not found'], 404);
        }

        if (!$paymentMethod->isAvailableForAmount($amount)) {
            return response()->json(['error' => 'Payment method not available for this amount'], 422);
        }

        return response()->json([
            'id' => $paymentMethod->id,
            'name' => $paymentMethod->name,
            'code' => $paymentMethod->code,
            'description' => $paymentMethod->description,
            'settings' => $paymentMethod->settings,
            'fee_amount' => $paymentMethod->getFeeAmount($amount),
            'fee_text' => $paymentMethod->fee_text,
        ]);
    }
}
