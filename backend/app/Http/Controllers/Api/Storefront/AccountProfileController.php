<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AccountProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'customer' => $request->user(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $customer = $request->user();

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('customers', 'email')->ignore($customer->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'accepts_marketing' => ['nullable', 'boolean'],
            'current_password' => ['nullable', 'string'],
            'password' => ['nullable', 'string', 'min:6', 'confirmed'],
        ]);

        if (!empty($validated['password'])) {
            $current = (string) ($validated['current_password'] ?? '');
            if ($current === '' || !Hash::check($current, $customer->password ?? '')) {
                return response()->json(['message' => 'Current password is incorrect.'], 422);
            }
        }

        $update = $validated;
        unset($update['current_password']);

        $customer->update($update);

        return response()->json([
            'customer' => $customer->fresh(),
        ]);
    }
}
