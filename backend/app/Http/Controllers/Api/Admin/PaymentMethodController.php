<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class PaymentMethodController extends Controller
{
    /**
     * Display a listing of payment methods.
     */
    public function index(): JsonResponse
    {
        $paymentMethods = PaymentMethod::ordered()->get();
        
        return response()->json($paymentMethods);
    }

    /**
     * Store a newly created payment method.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:payment_methods,code',
            'description' => 'nullable|string',
            'enabled' => 'boolean',
            'settings' => 'array',
            'settings.fee_operation' => 'nullable|string|in:add,discount',
            'settings.fee_type' => 'required_with:settings|string|in:fixed,percentage',
            'settings.fee_amount' => 'required_with:settings.fee_type,fixed|numeric|min:0',
            'settings.fee_percentage' => 'required_with:settings.fee_type,percentage|numeric|min:0|max:100',
            'settings.min_amount' => 'nullable|numeric|min:0',
            'settings.max_amount' => 'nullable|numeric|min:0',
            'settings.bank_info' => 'nullable|string',
            'position' => 'integer|min:0',
        ]);

        $paymentMethod = PaymentMethod::create($validated);

        return response()->json($paymentMethod, 201);
    }

    /**
     * Display the specified payment method.
     */
    public function show(PaymentMethod $paymentMethod): JsonResponse
    {
        return response()->json($paymentMethod);
    }

    /**
     * Update the specified payment method.
     */
    public function update(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('payment_methods')->ignore($paymentMethod->id),
            ],
            'description' => 'nullable|string',
            'enabled' => 'boolean',
            'settings' => 'array',
            'settings.fee_operation' => 'nullable|string|in:add,discount',
            'settings.fee_type' => 'required_with:settings|string|in:fixed,percentage',
            'settings.fee_amount' => 'required_with:settings.fee_type,fixed|numeric|min:0',
            'settings.fee_percentage' => 'required_with:settings.fee_type,percentage|numeric|min:0|max:100',
            'settings.min_amount' => 'nullable|numeric|min:0',
            'settings.max_amount' => 'nullable|numeric|min:0',
            'settings.bank_info' => 'nullable|string',
            'position' => 'integer|min:0',
        ]);

        $paymentMethod->update($validated);

        return response()->json($paymentMethod);
    }

    /**
     * Remove the specified payment method.
     */
    public function destroy(PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->delete();

        return response()->json(null, 204);
    }

    /**
     * Toggle payment method status.
     */
    public function toggle(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $paymentMethod->update(['enabled' => $validated['enabled']]);

        return response()->json($paymentMethod);
    }

    /**
     * Reorder payment methods.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_methods' => 'required|array',
            'payment_methods.*.id' => 'required|exists:payment_methods,id',
            'payment_methods.*.position' => 'required|integer|min:0',
        ]);

        foreach ($validated['payment_methods'] as $item) {
            PaymentMethod::where('id', $item['id'])
                ->update(['position' => $item['position']]);
        }

        return response()->json(['message' => 'Payment methods reordered successfully']);
    }
}
