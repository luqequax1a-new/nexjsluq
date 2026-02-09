<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Mail\CustomerWelcomeMail;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:customers,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'accepts_marketing' => ['nullable', 'boolean'],
        ]);

        $customer = Customer::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'accepts_marketing' => $validated['accepts_marketing'] ?? false,
            'password' => $validated['password'],
            'is_active' => true,
        ]);

        $token = $customer->createToken('customer')->plainTextToken;

        dispatch(function () use ($customer) {
            try {
                Mail::to($customer->email)->send(new CustomerWelcomeMail($customer));
            } catch (\Throwable $e) {
                Log::error('customer.welcome_email_failed', [
                    'customer_id' => $customer->id,
                    'email' => $customer->email,
                    'error' => $e->getMessage(),
                ]);
            }
        })->afterResponse();

        return response()->json([
            'customer' => $customer,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $customer = Customer::where('email', $validated['email'])->first();

        if (!$customer || !Hash::check($validated['password'], $customer->password ?? '')) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if ($customer->is_active === false) {
            return response()->json(['message' => 'Account is inactive.'], 403);
        }

        $token = $customer->createToken('customer')->plainTextToken;

        return response()->json([
            'customer' => $customer,
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['ok' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'customer' => $request->user(),
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::broker('customers')->sendResetLink([
            'email' => $validated['email'],
        ]);

        return response()->json([
            'message' => __($status),
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $status = Password::broker('customers')->reset(
            $validated,
            function (Customer $customer, string $password) {
                $customer->password = $password;
                $customer->setRememberToken(Str::random(60));
                $customer->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => __($status)]);
    }
}
