<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use App\Services\PostalCodeResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountAddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customer = $request->user();

        $addresses = $customer->addresses()
            ->orderByDesc('is_default_shipping')
            ->orderByDesc('is_default_billing')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'addresses' => $addresses,
            'default_shipping_id' => $customer->defaultShippingAddress()?->id,
            'default_billing_id' => $customer->defaultBillingAddress()?->id,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $customer = $request->user();

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:100'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'in:individual,corporate'],
            'phone' => ['required', 'string', 'regex:/^\+90\d{10}$/'],
            'company' => ['nullable', 'string', 'max:255'],
            'tax_number' => ['nullable', 'string', 'max:50'],
            'tax_office' => ['nullable', 'string', 'max:255'],
            'address_line_1' => ['required', 'string'],
            'city' => ['required', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:2'],
            'is_default_billing' => ['boolean'],
            'is_default_shipping' => ['boolean'],
        ]);

        $validated['phone'] = $this->normalizeTrPhone($validated['phone'] ?? null);
        $validated['address_line_2'] = null;
        $validated['postal_code'] = PostalCodeResolver::resolve(
            $validated['city'] ?? null,
            $validated['state'] ?? null
        );

        if ($validated['is_default_billing'] ?? false) {
            $customer->addresses()->update(['is_default_billing' => false]);
        }
        if ($validated['is_default_shipping'] ?? false) {
            $customer->addresses()->update(['is_default_shipping' => false]);
        }

        $address = $customer->addresses()->create($validated);

        return response()->json([
            'address' => $address,
        ], 201);
    }

    public function update(Request $request, CustomerAddress $address): JsonResponse
    {
        $customer = $request->user();

        if ($address->customer_id !== $customer->id) {
            return response()->json(['message' => 'Adres bulunamadı'], 404);
        }

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:100'],
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'in:individual,corporate'],
            'phone' => ['sometimes', 'required', 'string', 'regex:/^\+90\d{10}$/'],
            'company' => ['nullable', 'string', 'max:255'],
            'tax_number' => ['nullable', 'string', 'max:50'],
            'tax_office' => ['nullable', 'string', 'max:255'],
            'address_line_1' => ['sometimes', 'string'],
            'city' => ['sometimes', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:2'],
            'is_default_billing' => ['boolean'],
            'is_default_shipping' => ['boolean'],
        ]);

        if (array_key_exists('phone', $validated)) {
            $validated['phone'] = $this->normalizeTrPhone($validated['phone'] ?? null);
        }

        $city = $validated['city'] ?? $address->city;
        $state = array_key_exists('state', $validated) ? $validated['state'] : $address->state;
        $validated['address_line_2'] = null;
        $validated['postal_code'] = PostalCodeResolver::resolve($city, $state);

        if ($validated['is_default_billing'] ?? false) {
            $customer->addresses()->where('id', '!=', $address->id)->update(['is_default_billing' => false]);
        }
        if ($validated['is_default_shipping'] ?? false) {
            $customer->addresses()->where('id', '!=', $address->id)->update(['is_default_shipping' => false]);
        }

        $address->update($validated);

        return response()->json([
            'address' => $address->fresh(),
        ]);
    }

    public function destroy(Request $request, CustomerAddress $address): JsonResponse
    {
        $customer = $request->user();

        if ($address->customer_id !== $customer->id) {
            return response()->json(['message' => 'Adres bulunamadı'], 404);
        }

        $address->delete();

        return response()->json(['ok' => true]);
    }

    private function normalizeTrPhone(?string $value): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $value);
        if (!$digits) {
            return null;
        }

        if (str_starts_with($digits, '90') && strlen($digits) > 10) {
            $digits = substr($digits, 2);
        }

        $digits = ltrim($digits, '0');
        $digits = substr($digits, 0, 10);

        return $digits !== '' ? '+90' . $digits : null;
    }
}
