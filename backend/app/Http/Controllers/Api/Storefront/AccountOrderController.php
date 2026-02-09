<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customer = $request->user();

        $perPage = (int) $request->input('per_page', 10);
        $orders = Order::where('customer_id', $customer->id)
            ->with(['items.product.saleUnit', 'items.product.productUnit', 'items.variant.media'])
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($orders);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $customer = $request->user();

        if ($order->customer_id !== $customer->id) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        $order->load([
            'items.product.saleUnit',
            'items.product.productUnit',
            'items.variant.media',
            'billingAddress',
            'shippingAddress',
            'histories',
        ]);

        return response()->json([
            'order' => $order,
        ]);
    }
}
