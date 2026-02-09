<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\ShippingMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingMethodController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $subtotal = (float) $request->get('subtotal', 0);
        $paymentMethod = (string) $request->get('payment_method', '');

        $methods = ShippingMethod::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->get()
            ->map(function (ShippingMethod $m) use ($subtotal, $paymentMethod) {
                $cost = $m->calculateCost($subtotal);
                if ($paymentMethod === 'cash_on_delivery' && $m->cod_enabled) {
                    $cost += (float) $m->cod_fee;
                }

                return [
                    'id' => $m->id,
                    'code' => $m->code,
                    'name' => $m->name,
                    'logo' => $m->logo,
                    'is_active' => $m->is_active,
                    'base_rate' => (float) $m->base_rate,
                    'free_threshold' => $m->free_threshold !== null ? (float) $m->free_threshold : null,
                    'cod_enabled' => (bool) $m->cod_enabled,
                    'cod_fee' => (float) $m->cod_fee,
                    'cost' => (float) $cost,
                ];
            })
            ->values();

        return response()->json($methods);
    }
}
