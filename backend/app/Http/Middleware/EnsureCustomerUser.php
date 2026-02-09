<?php

namespace App\Http\Middleware;

use App\Models\Customer;
use Closure;
use Illuminate\Http\Request;

class EnsureCustomerUser
{
    public function handle(Request $request, Closure $next)
    {
        $customer = $request->user();

        if (!($customer instanceof Customer)) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($customer->is_active === false) {
            return response()->json(['message' => 'Account is inactive.'], 403);
        }

        return $next($request);
    }
}
