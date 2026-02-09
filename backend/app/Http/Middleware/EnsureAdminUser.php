<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;

class EnsureAdminUser
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!($user instanceof User)) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return $next($request);
    }
}
